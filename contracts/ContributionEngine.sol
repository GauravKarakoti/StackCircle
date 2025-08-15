// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./interfaces/IBtcTimeStamp.sol";
import "./interfaces/ICircleFactory.sol";
import "./interfaces/ILendingPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGovernanceToken {
    function mint(address to, uint256 amount) external;
}

contract ContributionEngine is Ownable, ReentrancyGuard {
    string public name;
    uint256 public contributionAmount;
    uint256 public contributionPeriod;
    address public BTC_TIMESTAMP_ORACLE;
    address public streakTracker;
    address public immutable factory;
    address public badgeSystem;
    uint256 public circleId;
    uint256 public totalContributions;
    address public treasury;
    
    // Layer 2 optimizations
    uint256 public batchProcessingFee = 0.0001 ether;
    mapping(address => bool) public isBatchOperator;
    
    // DAO integration
    uint256 public constant PROTOCOL_FEE_BPS = 100; // 1%
    IGovernanceToken public governanceToken;
    
    // Stateless client support
    bytes32 public merkleRoot;
    
    struct Member {
        uint256 lastContribution;
        uint256 totalContributed;
        bool exists;
        uint256 creditScore;
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
    event BatchContribution(
        address indexed operator,
        uint256 memberCount,
        uint256 totalAmount
    );
    event CreditScoreUpdated(
        address indexed member,
        uint256 newScore
    );
    event BatchOperatorUpdated(
        address indexed operator,
        bool status
    );

    constructor(
        string memory _name,
        uint256 _contributionAmount,
        uint256 _contributionPeriod,
        address _btcOracle,
        address _factory,
        address _treasury
    ) Ownable(msg.sender) {
        name = _name;
        contributionAmount = _contributionAmount;
        contributionPeriod = _contributionPeriod;
        BTC_TIMESTAMP_ORACLE = _btcOracle;
        factory = _factory;
        treasury = _treasury;
    }
    
    // Set circle ID (called by factory)
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
    
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
    
    function setGovernanceToken(address _token) external onlyOwner {
        governanceToken = IGovernanceToken(_token);
    }
    
    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;
    }
    
    function setBatchOperator(address operator, bool status) external onlyOwner {
        isBatchOperator[operator] = status;
        emit BatchOperatorUpdated(operator, status);
    }
    
    function addMember(address member) external onlyOwner {
        require(!members[member].exists, "Already member");
        members[member] = Member(0, 0, true, 500); // Initial credit score 500
        memberList.push(member);
        
        // Notify factory about new member
        ICircleFactory(factory).addMemberToCircle(circleId, member);
        emit MemberAdded(member);
    }

    // Main contribution function with protocol fee
    function contribute() external payable nonReentrant {
        _processContribution(msg.sender);
    }
    
    // Layer 2 batch processing
    function batchContribute(address[] calldata _members) external payable {
        require(isBatchOperator[msg.sender], "Unauthorized operator");
        uint256 totalAmount = contributionAmount * _members.length;
        uint256 totalFee = batchProcessingFee * _members.length;
        require(msg.value >= totalAmount + totalFee, "Insufficient funds");
        
        for (uint i = 0; i < _members.length; i++) {
            _processContribution(_members[i]);
        }
        
        // Refund any excess
        if (msg.value > totalAmount + totalFee) {
            payable(msg.sender).transfer(msg.value - totalAmount - totalFee);
        }
        
        emit BatchContribution(msg.sender, _members.length, totalAmount);
    }
    
    function _processContribution(address member) private {
        require(members[member].exists, "Not member");
        require(
            block.timestamp > members[member].lastContribution + contributionPeriod/2,
            "Contribution too soon"
        );
        
        // Verify Bitcoin timestamp proof
        uint256 btcHeight = IBtcTimestamp(BTC_TIMESTAMP_ORACLE).verifyTimestamp(block.timestamp);
        
        // Calculate protocol fee
        uint256 protocolFee = (contributionAmount * PROTOCOL_FEE_BPS) / 10000;
        uint256 netContribution = contributionAmount - protocolFee;
        
        // Update member stats
        totalContributions += netContribution;
        members[member].lastContribution = block.timestamp;
        members[member].totalContributed += netContribution;
        
        // Update credit score (simplified model)
        members[member].creditScore = members[member].creditScore + 10 > 850 ? 
            850 : members[member].creditScore + 10;
        
        // Send fee to treasury
        if (protocolFee > 0) {
            (bool feeSuccess, ) = treasury.call{value: protocolFee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Notify streak tracker
        if (streakTracker != address(0)) {
            (bool streakSuccess, ) = streakTracker.call(
                abi.encodeWithSignature("recordContribution(address)", member)
            );
            require(streakSuccess, "Streak update failed");
        }
        
        // Mint badge if eligible
        if (badgeSystem != address(0) && members[member].totalContributed >= 0.1 ether) {
            (bool badgeSuccess, ) = badgeSystem.call(
                abi.encodeWithSignature("mintBadge(uint256,address,uint256)", circleId, member, 2)
            );
            if (!badgeSuccess) {
                revert("Badge minting failed");
            }
        }

        if (address(governanceToken) != address(0)) {
            uint256 tokenReward = contributionAmount * 10; // 10 tokens per 0.01 BTC
            governanceToken.mint(member, tokenReward);
        }

        ICircleFactory(factory).updateCircleTotalContributed(circleId, netContribution);
        
        emit ContributionMade(
            member,
            netContribution,
            block.timestamp,
            btcHeight
        );
        emit CreditScoreUpdated(member, members[member].creditScore);
    }
    
    // Stateless client verification
    function verifyMembership(
        address member,
        bytes32[] calldata proof
    ) external view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(member));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
    
    // Lending integration
    function requestLoan(
        uint256 amount,
        uint256 duration,
        address poolAddress
    ) external {
        require(members[msg.sender].exists, "Not member");
        require(members[msg.sender].creditScore >= 600, "Insufficient credit");
        
        ILendingPool pool = ILendingPool(poolAddress);
        pool.requestLoan(circleId, msg.sender, amount, duration);
        
        // Adjust credit score
        members[msg.sender].creditScore -= 50;
    }
    
    function getMembers() external view returns (address[] memory) {
        return memberList;
    }
    
    function getCreditScore(address member) external view returns (uint256) {
        return members[member].creditScore;
    }

    function addInitialCreator(address creator) external onlyOwner {
        require(memberList.length == 0, "Initial creator already set");
        require(!members[creator].exists, "Already a member");
        
        members[creator] = Member(0, 0, true, 500); // Initial credit score 500
        memberList.push(creator);
        
        emit MemberAdded(creator);
    }
}