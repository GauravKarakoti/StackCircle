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
    const address = await contract.getAddress();
    console.log(`${contractName} deployed to: ${address}`);
    return contract;
  };

  // Helper function to send a transaction with managed nonce
  const sendTxWithNonce = async (contract, method, args = [], overrides = {}) => {
    try {
      const opts = { ...overrides, nonce: currentNonce++ };
      const tx = await contract[method](...args, opts);
      const receipt = await tx.wait();
      console.log(`✅ Tx: ${method}(${args.join(", ")}) confirmed.`);
      return receipt;
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
    const stackTokenAddress = await stackToken.getAddress();
    
    const treasury = await deployWithNonce("Treasury", deployer.address, stackTokenAddress);
    const treasuryAddress = await treasury.getAddress();
    
    const lendingPool = await deployWithNonce("LendingPool", stackTokenAddress);
    const lendingPoolAddress = await lendingPool.getAddress();
    
    const semaphoreMock = await deployWithNonce("SemaphoreMock");
    const semaphoreMockAddress = await semaphoreMock.getAddress();
    
    const btcTimestampMock = await deployWithNonce("BtcTimestampMock");
    const btcTimestampMockAddress = await btcTimestampMock.getAddress();
    
    const badgeSystem = await deployWithNonce("BadgeSystem", deployer.address);
    const badgeSystemAddress = await badgeSystem.getAddress();
    
    // 2. Deploy CircleFactory
    const circleFactory = await deployWithNonce(
      "CircleFactory",
      btcTimestampMockAddress,
      badgeSystemAddress,
      deployer.address
    );
    const circleFactoryAddress = await circleFactory.getAddress();

    // 3. Deploy CircleDeployer
    const circleDeployer = await deployWithNonce(
      "CircleDeployer",
      circleFactoryAddress,
      btcTimestampMockAddress,
      treasuryAddress
    );
    const circleDeployerAddress = await circleDeployer.getAddress();

    // 4. Set up initial permissions
    await sendTxWithNonce(badgeSystem, "setFactory", [circleFactoryAddress]);
    await sendTxWithNonce(badgeSystem, "transferOwnership", [circleFactoryAddress]);
    
    // 5. Transfer ownership of CircleFactory
    console.log("🔐 Transferring CircleFactory ownership to CircleDeployer...");
    await sendTxWithNonce(circleFactory, "transferOwnership", [circleDeployerAddress]);
    
    // 6. Create test circle
    console.log("\n🚀 Creating test circle via CircleDeployer...");
    const contributionAmount = ethers.parseEther("0.01");
    const period = 604800; // 7 days

    // THE FIX: Add 'false' for the 'isPremium' parameter
    const deployerReceipt = await sendTxWithNonce(
      circleDeployer,
      "deployAndRegisterCircle",
      [
        "Family Savings",
        ethers.parseEther("1.0"),
        contributionAmount,
        period,
        deployer.address,
        false // Explicitly set the test circle to be non-premium
      ]
    );

    // 7. Parse event
    const circleCreatedTopic = circleFactory.interface.getEvent("CircleCreated").topicHash;
    const log = deployerReceipt.logs.find(x => x.topics[0] === circleCreatedTopic);
    
    if (!log) {
      throw new Error("CircleCreated event not found");
    }
    
    const parsedLog = circleFactory.interface.parseLog(log);
    const [circleId, owner, engineAddress, trackerAddress, goal] = parsedLog.args;
    
    // 8. Save config
    const config = {
      network: "localhost",
      deployerContractAddress: circleDeployerAddress,
      circleFactory: circleFactoryAddress,
      badgeSystem: badgeSystemAddress,
      btcOracle: btcTimestampMockAddress,
      treasury: treasuryAddress,
      semaphore: semaphoreMockAddress,
      stackToken: stackTokenAddress,
      lendingPool: lendingPoolAddress,
      testCircle: {
        id: circleId.toString(),
        engine: engineAddress,
        tracker: trackerAddress,
        governance: (await circleFactory.getCircle(circleId)).governance
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