// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CircleFactory.sol";
import "./ContributionEngine.sol";
import "./CircleGovernance.sol";
import "./StreakTracker.sol";

contract CircleDeployer is Ownable {
    address public immutable factoryAddress;
    address public immutable btcOracleAddress;
    address public immutable treasuryAddress;
    address public immutable badgeSystemAddress; // <-- FIX: Added badge system address

    constructor(
        address _factoryAddress,
        address _btcOracleAddress,
        address _treasuryAddress,
        address _badgeSystemAddress // <-- FIX: Added to constructor
    ) Ownable(msg.sender) {
        factoryAddress = _factoryAddress;
        btcOracleAddress = _btcOracleAddress;
        treasuryAddress = _treasuryAddress;
        badgeSystemAddress = _badgeSystemAddress; // <-- FIX: Store address
    }

    function deployAndRegisterCircle(
        string memory name,
        uint256 goal,
        uint256 contributionAmount,
        uint256 contributionPeriod,
        address circleOwner,
        bool isPremium
    ) external payable onlyOwner {
        // 1. Deploy all component contracts
        ContributionEngine engine = new ContributionEngine(
            string.concat(name, " Engine"),
            contributionAmount,
            contributionPeriod,
            btcOracleAddress,
            factoryAddress,
            treasuryAddress
        );

        // FIX: Deploy governance contract with this deployer as the temporary owner
        // to allow for initialization calls.
        CircleGovernance governance = new CircleGovernance(address(this), factoryAddress);
        StreakTracker tracker = new StreakTracker();

        // 2. Register the circle with the factory
        uint256 circleId = CircleFactory(factoryAddress).registerCircle{value: msg.value}(
            name,
            goal,
            address(engine),
            address(tracker),
            address(governance),
            circleOwner,
            isPremium
        );

        // 3. Perform all initialization calls
        // --- Engine Setup ---
        engine.setCircleId(circleId);
        engine.addInitialCreator(circleOwner);
        engine.setStreakTracker(address(tracker));
        engine.setBadgeSystem(badgeSystemAddress); // Set the badge system dependency
        
        // --- StreakTracker Setup ---
        tracker.setCircleId(circleId);
        tracker.setEngine(address(engine));

        // --- Governance Setup ---
        // FIX: Call the correct `setDependencies` function.
        governance.setDependencies(circleId, badgeSystemAddress);
        
        // 4. Transfer ownership of components
        engine.transferOwnership(factoryAddress);
        tracker.transferOwnership(factoryAddress);
        
        // FIX: Transfer governance ownership to the final intended owner.
        governance.transferOwnership(circleOwner);
        governance.acceptOwnership();
    }
}