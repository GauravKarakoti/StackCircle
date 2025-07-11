// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ICircleFactory {
    struct Circle {
        address engine;
        address tracker;
        address governance;
        uint256 goal;
        uint256 created;
    }
    
    function circleExists(uint256 circleId) external view returns (bool);
    function getCircle(uint256 circleId) external view returns (Circle memory);
}