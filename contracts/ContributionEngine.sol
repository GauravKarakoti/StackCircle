// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./interfaces/IBtcTimeStamp.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CircleFactory.sol";

contract ContributionEngine is Ownable {
    string public name;
    uint256 public contributionAmount;
    uint256 public contributionPeriod;
    address public BTC_TIMESTAMP_ORACLE;
    address public streakTracker;
    
    struct Member {
        uint256 lastContribution;
        uint256 totalContributed;
        bool exists;
    }
    
    mapping(address => Member) public members;
    address[] public memberList;
    
    event ContributionMade(
        address indexed member,
        uint256 amount,
        uint256 timestamp,
        uint256 btcBlockHeight
    );
    event MemberAdded(address indexed member);
    
    constructor(
        string memory _name,
        uint256 _contributionAmount,
        uint256 _contributionPeriod,
        address _btcOracle
    ) Ownable(tx.origin) {  // Fixed: Added initial owner argument
        name = _name;
        contributionAmount = _contributionAmount;
        contributionPeriod = _contributionPeriod;
        BTC_TIMESTAMP_ORACLE = _btcOracle;
    }
    
    function setStreakTracker(address _tracker) external onlyOwner {
        streakTracker = _tracker;
    }
    
    function addMember(address member) external onlyOwner {
        require(!members[member].exists, "Already member");
        members[member] = Member(0, 0, true);
        memberList.push(member);
        emit MemberAdded(member);
    }
    
    function contribute() external payable {
        require(members[msg.sender].exists, "Not member");
        require(msg.value == contributionAmount, "Incorrect amount");
        
        // Verify Bitcoin timestamp proof
        uint256 btcHeight = IBtcTimestamp(BTC_TIMESTAMP_ORACLE).verifyTimestamp(block.timestamp);
        
        // Update member stats
        members[msg.sender].lastContribution = block.timestamp;
        members[msg.sender].totalContributed += msg.value;
        
        // Notify streak tracker
        if (streakTracker != address(0)) {
            (bool success, ) = streakTracker.call(
                abi.encodeWithSignature("recordContribution(address)", msg.sender)
            );
            require(success, "Streak update failed");
        }

        if (members[msg.sender].totalContributed >= 0.1 ether) {
            IBadgeSystem(badgeSystem).mintBadge(circleId, msg.sender, 2);
        }
        
        emit ContributionMade(
            msg.sender,
            msg.value,
            block.timestamp,
            btcHeight
        );
    }
    
    function getMembers() external view returns (address[] memory) {
        return memberList;
    }
}