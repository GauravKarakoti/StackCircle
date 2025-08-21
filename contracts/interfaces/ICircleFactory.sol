// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ICircleFactory {
    struct Circle {
        address engine;
        address tracker;
        address governance;
        string name;
        uint256 goal;
        uint256 created;
        uint256 memberCount;
        uint256 longestStreak;
        uint256 totalContributed;
    }

    function circleExists(uint256 circleId) external view returns (bool);
    function getCircle(uint256 circleId) external view returns (Circle memory);
    function addMemberToCircle(uint256 circleId, address member) external;
    function updateCircleTotalContributed(uint256 circleId, uint256 amount) external;
    
    function isCircleMember(uint256 circleId, address member) external view returns (bool);
}