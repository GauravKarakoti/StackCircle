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
    // const badgeSystemAddress = await circleFactory.badgeSystem();
    // console.log("BadgeSystem deployed to:", badgeSystemAddress);
    
    // Save deployment addresses for frontend
    const config = {
      network: "citrea-testnet",
      circleFactory: circleFactory.target,
      // badgeSystem: badgeSystemAddress,
      btcOracle: btcTimestampMock.target,
      semaphore: semaphoreMock.target
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