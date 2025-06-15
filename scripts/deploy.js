const { ethers } = require("hardhat");

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

  // Helper for transactions
  const sendTxWithNonce = async (contract, method, ...args) => {
    const tx = await contract[method](...args, { nonce: currentNonce++ });
    await tx.wait();
    return tx;
  };

  try {
    // 1. Deploy Mock Semaphore
    const semaphoreMock = await deployWithNonce("SemaphoreMock");
    
    // 2. Deploy Mock BTC Timestamp Oracle
    const btcTimestampMock = await deployWithNonce("BtcTimestampMock");
    
    // 3. Deploy StreakTracker
    const streakTracker = await deployWithNonce("StreakTracker");
    
    // Update StreakTracker with Semaphore address
    await sendTxWithNonce(streakTracker, "setSemaphore", semaphoreMock.target);
    console.log("Set Semaphore address in StreakTracker");
    
    // 4. Deploy CircleFactory with proper arguments
    const circleFactory = await deployWithNonce(
      "CircleFactory",
      btcTimestampMock.target  // Only BTC oracle address needed
    );
    
    // 5. Create a test circle
    const createCircleTx = await sendTxWithNonce(
      circleFactory,
      "createCircle",
      "Family Savings", 
      ethers.parseEther("1.0"),
      ethers.parseEther("0.01"),
      604800 // 7 days in seconds
    );
    
    const receipt = await createCircleTx.wait();
    const circleCreatedEvent = receipt.logs?.find(log => 
      log.fragment?.name === "CircleCreated"
    );
    
    if (circleCreatedEvent) {
      const [circleId, owner, engine, tracker, goal] = circleCreatedEvent.args;
      console.log("\nTest Circle Created:");
      console.log("Circle ID:", circleId.toString());
      console.log("Owner:", owner);
      console.log("Engine Address:", engine);
      console.log("Tracker Address:", tracker);
      console.log("Goal:", ethers.formatEther(goal), "BTC");
    }

    // Save deployment addresses for frontend
    const fs = require("fs");
    const config = {
      network: "citrea-testnet",
      circleFactory: circleFactory.target,
      btcOracle: btcTimestampMock.target,
      semaphore: semaphoreMock.target
    };
    
    fs.writeFileSync("./frontend/src/config.json", JSON.stringify(config, null, 2));
    console.log("\nConfig saved to frontend/src/config.json");
    console.log("Final nonce:", currentNonce);
  } catch (error) {
    console.error("Error at nonce:", currentNonce, error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });