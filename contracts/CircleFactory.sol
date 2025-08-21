// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./ContributionEngine.sol";
import "./StreakTracker.sol";
import "./BadgeSystem.sol";
import "./CircleGovernance.sol";

// The CircleFactory now acts as a registry and no longer deploys contracts itself
// to avoid exceeding the contract size limit. It is also Ownable to control
// who can register new circles.
contract CircleFactory is ERC721, Ownable {
    uint256 public circleCount;
    address public immutable BTC_TIMESTAMP_ORACLE;
    uint256 public constant PREMIUM_FEE = 0.01 ether;
    
    struct Circle {
        address engine;
        address tracker;
        address governance;
        string  name;
        uint256 goal;
        uint256 created;
        uint256 memberCount;  // Track number of members
        uint256 longestStreak;
        uint256 totalContributed;
    }

    address public badgeSystem;
    
    mapping(uint256 => Circle) public circles;
    mapping(address => uint256) public circleIds;
    mapping(address => uint256[]) private memberCircles;
    mapping(uint256 => address[]) private circleMembers;
    mapping(uint256 => bool) public premiumCircles;
    mapping(uint256 => bytes32) public merkleRoots;

    event CircleCreated(
        uint256 indexed circleId,
        address indexed owner,
        address engine,
        address tracker,
        uint256 goal
    );

    event MemberAdded(uint256 indexed circleId, address indexed member);
    event ProposalCreated(uint256 indexed circleId, uint256 proposalId);

    constructor(
        address _btcOracle,
        address _badgeSystem,
        address initialOwner
    ) ERC721("StackCircle", "SCIR") Ownable(initialOwner) {
        BTC_TIMESTAMP_ORACLE = _btcOracle;
        badgeSystem = _badgeSystem;
    }

    function registerCircle(
        string memory name,
        uint256 goal,
        address engine,
        address tracker,
        address governance,
        address circleOwner,
        bool isPremium
    ) external payable onlyOwner returns (uint256) {
        if (isPremium) {
            require(msg.value >= PREMIUM_FEE, "Insufficient premium fee");
        }

        circleCount++;
        uint256 newCircleId = circleCount;
        premiumCircles[newCircleId] = isPremium;

        circles[newCircleId] = Circle({
            engine: engine,
            tracker: tracker,
            governance: governance,
            name: name,
            goal: goal,
            created: block.timestamp,
            memberCount: 1,      // Creator is first member
            longestStreak: 0,
            totalContributed: 0
        });
        
        _safeMint(circleOwner, newCircleId);
        circleIds[engine] = newCircleId;

        _addMemberToCircle(newCircleId, circleOwner);
        
        emit CircleCreated(
            newCircleId,
            circleOwner,
            engine,
            tracker,
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

    function createProposal(
        uint256 circleId,
        CircleGovernance.ProposalType proposalType,
        string memory title,
        string memory description,
        uint256 amount,
        address recipient
    ) external {
        require(isCircleMember(circleId, msg.sender), "Caller is not a circle member");
        
        CircleGovernance governance = CircleGovernance(circles[circleId].governance);
        
        governance.createProposal(proposalType, title, description, amount, recipient);
        
        uint256 proposalId = governance.proposalCount();
        
        emit ProposalCreated(circleId, proposalId);
    }

    function verifyMembership(
        uint256 circleId,
        address member,
        bytes32[] calldata proof
    ) external view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(member));
        return MerkleProof.verify(proof, merkleRoots[circleId], leaf);
    }

    function addMember(uint256 circleId, address newMember) external {
        require(isCircleMember(circleId, msg.sender), "Caller not a member");
        
        ContributionEngine engine = ContributionEngine(circles[circleId].engine);
        engine.addMember(newMember);
        
        _addMemberToCircle(circleId, newMember);
    }

    function addMemberToCircle(uint256 circleId, address member) external {
        require(circles[circleId].engine == msg.sender, "Only circle engine can add members");
        _addMemberToCircle(circleId, member);
    }
    
    function _addMemberToCircle(uint256 circleId, address member) private {
        for (uint i = 0; i < memberCircles[member].length; i++) {
            if (memberCircles[member][i] == circleId) return;
        }
        
        memberCircles[member].push(circleId);
        circleMembers[circleId].push(member);
        circles[circleId].memberCount++;
        emit MemberAdded(circleId, member);
    }
    
    // --- FIX: Added the implementation for isCircleMember ---
    function isCircleMember(uint256 circleId, address member) public view returns (bool) {
        require(circleId > 0 && circleId <= circleCount, "Invalid circle ID");
        address[] storage members = circleMembers[circleId];
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == member) {
                return true;
            }
        }
        return false;
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