// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICircleFactory.sol";

contract BadgeSystem is ERC1155, Ownable {
    ICircleFactory public factory;
    bool private initialized;

    mapping(uint256 => string) public badgeURIs;
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public hasBadge;

    event BadgeMinted(address indexed recipient, uint256 badgeId, uint256 circleId);

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

    function setFactory(address _factory) external onlyOwner {
        factory = ICircleFactory(_factory);
    }
    
    function mintBadge(uint256 circleId, address recipient, uint256 badgeId) external {
        require(address(factory) != address(0), "Factory not set");
        require(factory.circleExists(circleId), "Invalid circle");
        require(!hasBadge[recipient][circleId][badgeId], "Already has badge in this circle");
        
        // FIX: Get the full Circle struct first...
        ICircleFactory.Circle memory circle = factory.getCircle(circleId);
        
        // ...then access the .engine property
        require(msg.sender == circle.engine, "Unauthorized caller");

        _mint(recipient, badgeId, 1, "");
        
        hasBadge[recipient][circleId][badgeId] = true;
        emit BadgeMinted(recipient, badgeId, circleId);
    }
    
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(bytes(badgeURIs[tokenId]).length > 0, "URI not set for this token type");
        return badgeURIs[tokenId];
    }
}