// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./CircleFactory.sol";
import "./ContributionEngine.sol";
import "./CircleGovernance.sol";
import "./StreakTracker.sol";

contract CircleDeployer {
    address public immutable factoryAddress;
    address public immutable btcOracleAddress;
    address public immutable treasuryAddress;

    constructor(
        address _factoryAddress,
        address _btcOracleAddress,
        address _treasuryAddress
    ) {
        factoryAddress = _factoryAddress;
        btcOracleAddress = _btcOracleAddress;
        treasuryAddress = _treasuryAddress;
    }

    function deployAndRegisterCircle(
        string memory name,
        uint256 goal,
        uint256 contributionAmount,
        uint256 contributionPeriod,
        address circleOwner,
        bool isPremium // 1. NEW: Add isPremium parameter
    ) external payable { // 2. MODIFIED: Make function payable
        // 1. Deploy all component contracts
        ContributionEngine engine = new ContributionEngine(
            string.concat(name, " Engine"),
            contributionAmount,
            contributionPeriod,
            btcOracleAddress,
            factoryAddress,
            treasuryAddress
        );

        CircleGovernance governance = new CircleGovernance(circleOwner, factoryAddress);
        StreakTracker tracker = new StreakTracker();

        // 2. Register the circle with the factory
        CircleFactory factory = CircleFactory(factoryAddress);
        uint256 circleId = factory.registerCircle{value: msg.value}( // 3. MODIFIED: Forward the transaction value
            name,
            goal,
            address(engine),
            address(tracker),
            address(governance),
            circleOwner,
            isPremium // 4. NEW: Pass isPremium to the factory
        );

        // 3. Perform all initialization calls
        // --- Engine Setup ---
        engine.setCircleId(circleId);
        engine.addInitialCreator(circleOwner);
        engine.setStreakTracker(address(tracker));
        
        // --- StreakTracker Setup ---
        tracker.setCircleId(circleId);
        tracker.setEngine(address(engine));
        
        // 4. Transfer ownership of components to the Factory for future management
        engine.transferOwnership(factoryAddress);
        tracker.transferOwnership(factoryAddress);
    }
}