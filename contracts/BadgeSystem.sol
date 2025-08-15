// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // Import Ownable
import "./interfaces/ICircleFactory.sol";

// BadgeSystem is now Ownable to allow for a two-step initialization
// that breaks the circular dependency with CircleFactory.
contract BadgeSystem is ERC1155, Ownable {
    ICircleFactory public factory;
    bool private initialized;
    
    // Badge types: 1 = Streak, 2 = Contribution, 3 = Governance
    mapping(uint256 => string) public badgeURIs;
    mapping(address => mapping(uint256 => bool)) public hasBadge;
    
    event BadgeMinted(address indexed recipient, uint256 badgeId, uint256 circleId);

    // The constructor now sets the initial owner. The factory address will be set later.
    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {
        _setBadgeURIs();
    }
    
    function _setBadgeURIs() private {
        badgeURIs[1] = "https://stackcircle.com/badges/streak.json";
        badgeURIs[2] = "https://stackcircle.com/badges/contributor.json";
        badgeURIs[3] = "https://stackcircle.com/badges/governor.json";
    }

    function initialize(address _factory) external onlyOwner {
        require(!initialized, "Already initialized");
        factory = ICircleFactory(_factory);
        initialized = true;
    }

    // New function to set the factory address, callable only by the owner.
    function setFactory(address _factory) external onlyOwner {
        factory = ICircleFactory(_factory);
    }
    
    function mintBadge(uint256 circleId, address recipient, uint256 badgeId) external {
        require(address(factory) != address(0), "Factory not set");
        require(factory.circleExists(circleId), "Invalid circle");
        // This authorization check is critical. It ensures only the correct ContributionEngine
        // can mint badges for its circle.
        require(msg.sender == factory.getCircle(circleId).engine, "Unauthorized");
        require(!hasBadge[recipient][badgeId], "Already has badge");
        
        _mint(recipient, badgeId, 1, "");
        hasBadge[recipient][badgeId] = true;
        emit BadgeMinted(recipient, badgeId, circleId);
    }
    
    function uri(uint256 tokenId) public view override returns (string memory) {
        return badgeURIs[tokenId];
    }
}