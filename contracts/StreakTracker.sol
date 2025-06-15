// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./interfaces/ISemaphore.sol";
import "./ContributionEngine.sol";

contract StreakTracker {
    ISemaphore public semaphore;
    address public engine;
    
    struct Streak {
        uint256 current;
        uint256 longest;
        uint256 lastUpdate;
    }
    
    mapping(address => Streak) public streaks;
    mapping(uint256 => address) public nullifierToAddress;
    
    event StreakUpdated(address indexed member, uint256 newStreak);
    event AnonymousStreakUpdated(uint256 nullifier, uint256 newStreak);
    
    constructor() {
        // Initialize with mainnet Semaphore address (testnet mock in deployment)
        semaphore = ISemaphore(0x0000000000000000000000000000000000000000);
    }
    
    function setEngine(address _engine) external {
        require(engine == address(0), "Already set");
        engine = _engine;
    }
    
    function recordContribution(address member) external {
        require(msg.sender == engine, "Unauthorized");
        _updateStreak(member);
    }
    
    function updateStreakAnonymously(
        uint256 nullifierHash,
        uint256 groupId,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        ISemaphore.SemaphoreProof memory semaphoreProof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: proof.merkleTreeDepth,
            merkleTreeRoot: proof.merkleTreeRoot,
            nullifier: nullifierHash,
            message: 0, // Not used in our case
            scope: uint256(keccak256(abi.encodePacked(engine))),
            points: proof.points
        });

        require(semaphore.verifyProof(groupId, semaphoreProof), "Invalid proof");
        
        address member = nullifierToAddress[nullifierHash];
        require(member != address(0), "Unknown nullifier");
        
        _updateStreak(member);
        emit AnonymousStreakUpdated(nullifierHash, streaks[member].current);
    }
    
    function registerNullifier(address member, uint256 nullifierHash) external {
        require(msg.sender == engine, "Unauthorized");
        nullifierToAddress[nullifierHash] = member;
    }
    
    function _updateStreak(address member) private {
        Streak storage streak = streaks[member];
        uint256 period = ContributionEngine(engine).contributionPeriod();

        if (block.timestamp > streak.lastUpdate + 2 * period) {
            streak.current = 1;
        } 
        // Increment streak if within period
        else if (block.timestamp > streak.lastUpdate + period) {
            streak.current++;
        }
        // If within grace period but not a full period, maintain streak
        else if (block.timestamp > streak.lastUpdate + period / 2) {
            // Maintain current streak without incrementing
        }
        // Otherwise reset (missed contribution window)
        else {
            streak.current = 1;
        }
        
        // Update longest streak if needed
        if (streak.current > streak.longest) {
            streak.longest = streak.current;
        }
        
        streak.lastUpdate = block.timestamp;
        emit StreakUpdated(member, streak.current);
    }

    function setSemaphore(address _semaphore) external {
        semaphore = ISemaphore(_semaphore);
    }
}