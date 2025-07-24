const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Get current nonce
  let currentNonce = await deployer.getNonce("pending");
  console.log("Starting nonce:", currentNonce);

  // Helper function to deploy with nonce
  const deployWithNonce = async (contractName, ...args) => {
    const factory = await ethers.getContractFactory(contractName);
    const contract = await factory.deploy(...args, { nonce: currentNonce++ });
    await contract.waitForDeployment();
    console.log(`${contractName} deployed to: ${contract.target}`);
    return contract;
  };

  const sendTxWithNonce = async (contract, method, args = [], overrides = {}) => {
    try {
      // pull out your gasLimit / value / etc., then inject the nonce:
      const opts = { ...overrides, nonce: currentNonce++ };

      // spread the real args, then the merged opts
      const tx = await contract[method]( ...args, opts );
      await tx.wait();
      console.log(`Tx: ${method}(${args.join(", ")})`, opts);
      return tx;
    } catch (error) {
      console.error(`Error in ${method}:`, error);
      // Attempt to decode revert reason
      if (error.data) {
        try {
          const revertReason = error.data.toString();
          console.error("Revert reason:", revertReason);
        } catch (decodeError) {
          console.error("Could not decode revert reason");
        }
      }
      
      throw error;
    }
  };

  try {
    // 1. Deploy Mock Semaphore
    const semaphoreMock = await deployWithNonce("SemaphoreMock");
    
    // 2. Deploy Mock BTC Timestamp Oracle
    const btcTimestampMock = await deployWithNonce("BtcTimestampMock");
    
    // 3. Deploy CircleFactory with proper arguments
    const circleFactory = await deployWithNonce(
      "CircleFactory",
      btcTimestampMock.target
    );
    
    // 4. Get BadgeSystem address from factory
    const badgeSystemAddress = await circleFactory.badgeSystem();
    console.log("BadgeSystem deployed to:", badgeSystemAddress);
    
    // 5. Create a test circle with increased gas limit
    console.log("Creating test circle...");
    const createCircleTx = await sendTxWithNonce(
      circleFactory,
      "createCircle",
      [
        "Family Savings",
        ethers.parseEther("1.0"),
        ethers.parseEther("0.01"),
        604800
      ]
    );
    
    const receipt = await createCircleTx.wait();
    const circleCreatedEvent = receipt.logs?.find(log => 
      log.fragment?.name === "CircleCreated"
    );
    
    if (!circleCreatedEvent) {
      throw new Error("CircleCreated event not found in transaction logs");
    }
    
    let circleId, owner, engineAddress, trackerAddress, goal;
    [circleId, owner, engineAddress, trackerAddress, goal] = circleCreatedEvent.args;
    console.log("\nTest Circle Created:");
    console.log("Circle ID:", circleId.toString());
    console.log("Owner:", owner);
    console.log("Engine Address:", engineAddress);
    console.log("Tracker Address:", trackerAddress);
    console.log("Goal:", ethers.formatEther(goal), "BTC");
    
    // 6. Get contracts for initialization
    const engine = await ethers.getContractAt("ContributionEngine", engineAddress);
    const tracker = await ethers.getContractAt("StreakTracker", trackerAddress);
    
    // 7. Set Semaphore for StreakTracker
    console.log("Configuring StreakTracker...");
    await sendTxWithNonce(tracker, "setSemaphore", [semaphoreMock.target]);
    
    // 8. Verify initialization
    console.log("\nVerifying initialization...");
    const trackerEngine = await tracker.engine();
    const trackerBadgeSystem = await tracker.badgeSystem();
    const trackerCircleId = await tracker.circleId();
    
    console.log("\nStreakTracker initialized:");
    console.log("Engine:", trackerEngine);
    console.log("BadgeSystem:", trackerBadgeSystem);
    console.log("Circle ID:", trackerCircleId.toString());

    const engineBadgeSystem = await engine.badgeSystem();
    const engineCircleId = await engine.circleId();
    
    console.log("\nContributionEngine initialized:");
    console.log("BadgeSystem:", engineBadgeSystem);
    console.log("Circle ID:", engineCircleId.toString());
    
    // 9. Make a test contribution
    console.log("\nMaking test contribution...");
    await sendTxWithNonce(
      engine,
      "contribute",
      [],
      { value: ethers.parseEther("0.01") }
    );
    console.log("Test contribution made");
    
    // 10. Check member streak
    const [currentStreak, longestStreak] = await tracker.streaks(deployer.address);
    console.log("\nMember streak after contribution:");
    console.log("Current:", currentStreak.toString());
    console.log("Longest:", longestStreak.toString());

    // 11. Test proposal creation
    console.log("\nCreating test proposal...");
    const proposalTx = await sendTxWithNonce(
      circleFactory,
      "createProposal",
      [
        circleId, 
        0, // DONATION type
        "Donate to Bitcoin Developers",
        "Proposal to donate 10% of funds to Bitcoin developers",
        ethers.parseEther("0.1"),
        deployer.address // Using deployer as recipient for test
      ]
    );
    
    const proposalReceipt = await proposalTx.wait();
    const proposalCreatedEvent = proposalReceipt.logs?.find(log => 
      log.fragment?.name === "ProposalCreated"
    );
    
    if (!proposalCreatedEvent) {
      throw new Error("ProposalCreated event not found in transaction logs");
    }
    
    const [proposalCircleId, proposalId] = proposalCreatedEvent.args;
    console.log("\nTest Proposal Created:");
    console.log("Circle ID:", proposalCircleId.toString());
    console.log("Proposal ID:", proposalId.toString());
    
    // Verify proposal exists in governance contract
    const circleData = await circleFactory.getCircle(circleId);
    const governance = await ethers.getContractAt("CircleGovernance", circleData.governance);
    
    const proposal = await governance.proposals(proposalId);
    console.log("\nProposal details from governance contract:");
    console.log("Title:", proposal.title);
    console.log("Description:", proposal.description);
    console.log("Amount:", ethers.formatEther(proposal.amount), "BTC");
    console.log("Recipient:", proposal.recipient);
    
    // Save deployment addresses for frontend
    const config = {
      network: "citrea-testnet",
      circleFactory: circleFactory.target,
      badgeSystem: badgeSystemAddress,
      btcOracle: btcTimestampMock.target,
      semaphore: semaphoreMock.target,
      testCircle: {
        id: circleId.toString(),
        engine: engineAddress,
        tracker: trackerAddress,
        governance: circleData.governance
      }
    };
    
    fs.writeFileSync("./frontend/src/config.json", JSON.stringify(config, null, 2));
    console.log("\nConfig saved to frontend/src/config.json");
    console.log("Final nonce:", currentNonce);
  } catch (error) {
    console.error("Deployment failed at nonce:", currentNonce, error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });