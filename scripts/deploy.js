const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Get current nonce
  let currentNonce = await deployer.getNonce();
  console.log("Starting nonce:", currentNonce);

  // Helper function to deploy with nonce
  const deployWithNonce = async (contractName, ...args) => {
    const factory = await ethers.getContractFactory(contractName);
    const contract = await factory.deploy(...args, { nonce: currentNonce++ });
    await contract.waitForDeployment();
    console.log(`${contractName} deployed to: ${await contract.getAddress()}`);
    return contract;
  };

  // Helper function to send a transaction with managed nonce
  const sendTxWithNonce = async (contract, method, args = [], overrides = {}) => {
    try {
      const opts = { ...overrides, nonce: currentNonce++ };
      const tx = await contract[method](...args, opts);
      const receipt = await tx.wait();
      console.log(`✅ Tx: ${method}(${args.join(", ")}) confirmed.`);
      return receipt; // Return the receipt for event parsing
    } catch (error) {
      console.error(`❌ Error in ${method}:`, error);
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
    // 1. Deploy Governance Token, Treasury, and other dependencies
    const stackToken = await deployWithNonce("StackToken");
    const treasury = await deployWithNonce("Treasury", deployer.address);
    const lendingPool = await deployWithNonce("LendingPool");
    const semaphoreMock = await deployWithNonce("SemaphoreMock");
    const btcTimestampMock = await deployWithNonce("BtcTimestampMock");
    const badgeSystem = await deployWithNonce("BadgeSystem", deployer.address);
    
    // 2. Deploy CircleFactory
    // The deployer is the initial owner, but will transfer ownership to the CircleDeployer
    const circleFactory = await deployWithNonce(
      "CircleFactory",
      await btcTimestampMock.getAddress(),
      await badgeSystem.getAddress(),
      deployer.address // initialOwner
    );

    // 3. Deploy the new CircleDeployer contract
    // This contract will orchestrate the creation of new circles.
    const circleDeployer = await deployWithNonce(
        "CircleDeployer",
        await circleFactory.getAddress(),
        await btcTimestampMock.getAddress(),
        await treasury.getAddress()
    );

    // 4. Set up initial permissions for the factory
    await sendTxWithNonce(badgeSystem, "setFactory", [await circleFactory.getAddress()]);
    await sendTxWithNonce(badgeSystem, "transferOwnership", [await circleFactory.getAddress()]);
    
    // 5. CRITICAL STEP: Transfer ownership of the CircleFactory to the CircleDeployer
    // This gives the deployer contract the permission to call `registerCircle`.
    console.log("🔐 Transferring CircleFactory ownership to CircleDeployer...");
    await sendTxWithNonce(circleFactory, "transferOwnership", [await circleDeployer.getAddress()]);
    
    // 6. Create a test circle using the new, robust CircleDeployer contract
    console.log("\n🚀 Creating test circle via CircleDeployer...");
    const contributionAmount = ethers.parseEther("0.01");
    const period = 604800; // 7 days

    const deployerReceipt = await sendTxWithNonce(
      circleDeployer,
      "deployAndRegisterCircle",
      [
        "Family Savings",             // name
        ethers.parseEther("1.0"),     // goal
        contributionAmount,           // contributionAmount
        period,                       // contributionPeriod
        deployer.address              // circleOwner
      ]
    );

    // 7. Parse the event from the transaction receipt to get the new circle's details
    const circleCreatedTopic = circleFactory.interface.getEvent("CircleCreated").topicHash;
    const log = deployerReceipt.logs.find(x => x.topics[0] === circleCreatedTopic);
    
    if (!log) {
      throw new Error("CircleCreated event not found in transaction logs from CircleDeployer");
    }
    
    const parsedLog = circleFactory.interface.parseLog(log);
    const [circleId, owner, engineAddress, trackerAddress, goal] = parsedLog.args;
    
    // Fetch the governance address from the newly created circle struct
    const circleData = await circleFactory.getCircle(circleId);
    const governanceAddress = circleData.governance;

    console.log("\n✅ Test Circle Registered via Deployer:");
    console.log("   Circle ID:", circleId.toString());
    console.log("   Owner:", owner);
    console.log("   Engine Address:", engineAddress);
    console.log("   Tracker Address:", trackerAddress);
    console.log("   Governance Address:", governanceAddress);
    console.log("   Goal:", ethers.formatEther(goal), "ETH");
    
    // 8. Save deployment addresses to config file for frontend and backend use
    const config = {
      network: "localhost",
      deployerContractAddress: await circleDeployer.getAddress(), // For the backend .env
      circleFactory: await circleFactory.getAddress(),
      badgeSystem: await badgeSystem.getAddress(),
      btcOracle: await btcTimestampMock.getAddress(),
      treasury: await treasury.getAddress(),
      semaphore: await semaphoreMock.getAddress(),
      stackToken: await stackToken.getAddress(),
      lendingPool: await lendingPool.getAddress(),
      testCircle: { // For frontend testing
        id: circleId.toString(),
        engine: engineAddress,
        tracker: trackerAddress,
        governance: governanceAddress
      }
    };
    
    fs.writeFileSync("./frontend/src/config.json", JSON.stringify(config, null, 2));
    console.log("\n✅ Config saved to frontend/src/config.json");
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