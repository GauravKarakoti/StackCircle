// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ContributionEngine.sol";
import "./StreakTracker.sol";
import "./BadgeSystem.sol";
import "./CircleGovernance.sol";

contract CircleFactory is ERC721 {
    uint256 public circleCount;
    address public immutable BTC_TIMESTAMP_ORACLE;
    
    struct Circle {
        address engine;
        address tracker;
        address governance;
        string  name;
        uint256 goal;
        uint256 created;
        uint256 memberCount;   // Track number of members
        uint256 longestStreak;
        uint256 totalContributed;
    }

    address public badgeSystem;
    
    mapping(uint256 => Circle) public circles;
    mapping(address => uint256) public circleIds;
    mapping(address => uint256[]) private memberCircles;
    mapping(uint256 => address[]) private circleMembers;
    
    event CircleCreated(
        uint256 indexed circleId,
        address indexed owner,
        address engine,
        address tracker,
        uint256 goal
    );

    event MemberAdded(uint256 indexed circleId, address indexed member);
    event ProposalCreated(uint256 indexed circleId, uint256 proposalId);

    constructor(address _btcOracle) ERC721("StackCircle", "SCIR") {
        BTC_TIMESTAMP_ORACLE = _btcOracle;
        badgeSystem = address(new BadgeSystem(address(this)));
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
            BTC_TIMESTAMP_ORACLE,
            address(this)
        );
        
        // Create streak tracker
        StreakTracker tracker = new StreakTracker();
        
        // Create governance contract
        CircleGovernance governance = new CircleGovernance(msg.sender);
        
        // Update circle struct
        circles[newCircleId] = Circle({
            engine: address(engine),
            tracker: address(tracker),
            governance: address(governance),
            name: name,
            goal: goal,
            created: block.timestamp,
            memberCount: 1,        // Creator is first member
            longestStreak: 0,
            totalContributed: 0
        });
        
        // Additional setup
        engine.setBadgeSystem(badgeSystem);
        tracker.setBadgeSystem(badgeSystem);
        engine.setCircleId(newCircleId);
        tracker.setCircleId(newCircleId);
        tracker.setEngine(address(engine));
        
        // Mint NFT to creator
        _safeMint(msg.sender, newCircleId);
        circleIds[address(engine)] = newCircleId;

        // Add creator as first member
        _addMemberToCircle(newCircleId, msg.sender);
        engine.addMember(msg.sender);
        
        emit CircleCreated(
            newCircleId,
            msg.sender,
            address(engine),
            address(tracker),
            goal
        );
        
        return newCircleId;
    }

    function updateCircleTotalContributed(uint256 circleId, uint256 amount) external {
        require(circleIds[msg.sender] == circleId, "Unauthorized");
        circles[circleId].totalContributed += amount;
    }

    function updateLongestStreak(uint256 circleId, uint256 streak) external {
        require(circleId > 0 && circleId <= circleCount, "Invalid circle ID");
        require(msg.sender == circles[circleId].tracker, "Unauthorized");
        if (streak > circles[circleId].longestStreak) {
            circles[circleId].longestStreak = streak;
        }
    }

    // Add this new function to create proposals
    function createProposal(
        uint256 circleId,
        CircleGovernance.ProposalType proposalType,
        string memory title,
        string memory description,
        uint256 amount,
        address recipient
    ) external {
        require(circleId > 0 && circleId <= circleCount, "Invalid circle ID");
        
        // Verify caller is a member of this circle
        bool isMember = false;
        address[] memory members = circleMembers[circleId];
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Caller is not a circle member");
        
        // Get the governance contract for this circle
        CircleGovernance governance = CircleGovernance(circles[circleId].governance);
        
        // Create the proposal
        governance.createProposal(proposalType, title, description, amount, recipient);
        
        // Emit event for frontend tracking
        uint256 proposalId = governance.proposalCount(); // Assuming this method exists
        emit ProposalCreated(circleId, proposalId);
    }

    function inviteMember(uint256 circleId, address newMember) external {
        require(circleId > 0 && circleId <= circleCount, "Invalid circle ID");
        
        // Verify caller is member
        bool isMember = false;
        address[] memory members = circleMembers[circleId];
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Caller not a member");
        
        ContributionEngine engine = ContributionEngine(circles[circleId].engine);
        engine.addMember(newMember);
        
        // Add to factory tracking
        _addMemberToCircle(circleId, newMember);
    }

    function addMemberToCircle(uint256 circleId, address member) external {
        require(circles[circleId].engine == msg.sender, "Only circle engine can add members");
        _addMemberToCircle(circleId, member);
    }
    
    function _addMemberToCircle(uint256 circleId, address member) private {
        // Avoid duplicates
        for (uint i = 0; i < memberCircles[member].length; i++) {
            if (memberCircles[member][i] == circleId) return;
        }
        
        memberCircles[member].push(circleId);
        circleMembers[circleId].push(member);
        circles[circleId].memberCount++;
        emit MemberAdded(circleId, member);
    }
    
    function getCirclesForMember(address member) external view returns (uint256[] memory) {
        return memberCircles[member];
    }
    
    function getCircleMembers(uint256 circleId) external view returns (address[] memory) {
        return circleMembers[circleId];
    }

    function circleExists(uint256 circleId) external view returns (bool) {
        return circles[circleId].engine != address(0);
    }
    
    function getCircle(uint256 circleId) external view returns (Circle memory) {
        return circles[circleId];
    }
}