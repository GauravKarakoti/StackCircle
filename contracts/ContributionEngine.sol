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
    address public immutable factory;
    address public badgeSystem;
    uint256 public circleId;
    uint256 public totalContributions;
    
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
        address _btcOracle,
        address _factory
    ) Ownable(msg.sender) {
        name = _name;
        contributionAmount = _contributionAmount;
        contributionPeriod = _contributionPeriod;
        BTC_TIMESTAMP_ORACLE = _btcOracle;
        factory = _factory;
    }
    
    // Add this new function to set circle ID
    function setCircleId(uint256 _circleId) external onlyOwner {
        require(circleId == 0, "Circle ID already set");
        circleId = _circleId;
    }
    
    function setStreakTracker(address _tracker) external onlyOwner {
        streakTracker = _tracker;
    }
    
    function setBadgeSystem(address _badgeSystem) external onlyOwner {
        badgeSystem = _badgeSystem;
    }
    
    function addMember(address member) external onlyOwner {
        require(!members[member].exists, "Already member");
        members[member] = Member(0, 0, true);
        memberList.push(member);
        
        // Notify factory about the new member
        CircleFactory(factory).addMemberToCircle(circleId, member);
        
        emit MemberAdded(member);
    }
    
    function contribute() external payable {
        require(members[msg.sender].exists, "Not member");
        require(msg.value == contributionAmount, "Incorrect amount");
        require(
            block.timestamp > members[msg.sender].lastContribution + contributionPeriod/2,
            "Contribution too soon"
        );
        
        // Verify Bitcoin timestamp proof
        uint256 btcHeight = IBtcTimestamp(BTC_TIMESTAMP_ORACLE).verifyTimestamp(block.timestamp);
        
        // Update member stats
        totalContributions += msg.value;
        members[msg.sender].lastContribution = block.timestamp;
        members[msg.sender].totalContributed += msg.value;
        
        // Notify streak tracker
        if (streakTracker != address(0)) {
            (bool success, ) = streakTracker.call(
                abi.encodeWithSignature("recordContribution(address)", msg.sender)
            );
            require(success, "Streak update failed");
        }
        
        // Mint badge if eligible
        if (badgeSystem != address(0) && members[msg.sender].totalContributed >= 0.1 ether) {
            (bool badgeSuccess, ) = badgeSystem.call(
                abi.encodeWithSignature("mintBadge(uint256,address,uint256)", circleId, msg.sender, 2)
            );
            if (!badgeSuccess) {
                // Don't fail transaction if badge minting fails
                revert("Badge minting failed");
            }
        }

        CircleFactory(factory).updateCircleTotalContributed(circleId, msg.value);
        
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