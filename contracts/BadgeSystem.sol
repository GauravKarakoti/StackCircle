// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICircleFactory.sol";

contract BadgeSystem is ERC1155, Ownable {
    ICircleFactory public factory;
    
    // Badge types: 1 = Streak, 2 = Contribution, 3 = Governance
    mapping(uint256 => string) public badgeURIs;
    mapping(address => mapping(uint256 => bool)) public hasBadge;
    
    event BadgeMinted(address indexed recipient, uint256 badgeId, uint256 circleId);

    constructor(address _factory) ERC1155("") {
        factory = ICircleFactory(_factory);
        _setBadgeURIs();
    }
    
    function _setBadgeURIs() private {
        badgeURIs[1] = "https://stackcircle.com/badges/streak.json";
        badgeURIs[2] = "https://stackcircle.com/badges/contributor.json";
        badgeURIs[3] = "https://stackcircle.com/badges/governor.json";
    }
    
    function mintBadge(uint256 circleId, address recipient, uint256 badgeId) external {
        require(factory.circleExists(circleId), "Invalid circle");
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