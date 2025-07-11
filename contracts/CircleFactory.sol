// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ContributionEngine.sol";
import "./StreakTracker.sol";

contract CircleFactory is ERC721 {
    uint256 public circleCount;
    address public immutable BTC_TIMESTAMP_ORACLE;
    
    struct Circle {
        address engine;
        address tracker;
        uint256 goal;
        uint256 created;
    }
    
    mapping(uint256 => Circle) public circles;
    mapping(address => uint256) public circleIds;
    
    event CircleCreated(
        uint256 indexed circleId,
        address indexed owner,
        address engine,
        address tracker,
        uint256 goal
    );

    constructor(address _btcOracle) ERC721("StackCircle", "SCIR") {
        BTC_TIMESTAMP_ORACLE = _btcOracle;
    }

    function createCircle(
        string memory name,
        uint256 goal,
        uint256 contributionAmount,
        uint256 period
    ) external returns (uint256) {
        circleCount++;
        uint256 newCircleId = circleCount;
        
        // Create contribution engine
        ContributionEngine engine = new ContributionEngine(
            name,
            contributionAmount,
            period,
            BTC_TIMESTAMP_ORACLE
        );
        
        // Create streak tracker
        StreakTracker tracker = new StreakTracker();
        
        // Store circle data
        circles[newCircleId] = Circle({
            engine: address(engine),
            tracker: address(tracker),
            goal: goal,
            created: block.timestamp
        });
        
        // Mint NFT to creator
        _safeMint(msg.sender, newCircleId);
        circleIds[address(engine)] = newCircleId;
        
        emit CircleCreated(
            newCircleId,
            msg.sender,
            address(engine),
            address(tracker),
            goal
        );
        
        return newCircleId;
    }

    function getCircle(uint256 circleId) external view returns (Circle memory) {
        return circles[circleId];
    }
}
