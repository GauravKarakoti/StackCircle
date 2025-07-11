// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IBadgeSystem {
    function mintBadge(uint256 circleId, address recipient, uint256 badgeId) external;
}