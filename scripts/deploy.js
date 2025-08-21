const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  let currentNonce = await deployer.getNonce();
  console.log("Starting nonce:", currentNonce);

  const deployWithNonce = async (contractName, ...args) => {
    const factory = await ethers.getContractFactory(contractName);
    const contract = await factory.deploy(...args, { nonce: currentNonce++ });
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`${contractName} deployed to: ${address}`);
    return contract;
  };

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
    // Deploy all dependencies
    const stackToken = await deployWithNonce("StackToken");
    const treasury = await deployWithNonce("Treasury", deployer.address, await stackToken.getAddress());
    const lendingPool = await deployWithNonce("LendingPool", await stackToken.getAddress());
    const semaphoreMock = await deployWithNonce("SemaphoreMock");
    const btcTimestampMock = await deployWithNonce("BtcTimestampMock");
    const badgeSystem = await deployWithNonce("BadgeSystem", deployer.address);
    
    const badgeSystemAddress = await badgeSystem.getAddress();
    const btcTimestampMockAddress = await btcTimestampMock.getAddress();
    const treasuryAddress = await treasury.getAddress();
    
    const circleFactory = await deployWithNonce(
      "CircleFactory",
      btcTimestampMockAddress,
      badgeSystemAddress,
      deployer.address
    );
    const circleFactoryAddress = await circleFactory.getAddress();

    const circleDeployer = await deployWithNonce(
      "CircleDeployer",
      circleFactoryAddress,
      btcTimestampMockAddress,
      treasuryAddress,
      badgeSystemAddress
    );
    const circleDeployerAddress = await circleDeployer.getAddress();

    // Setup permissions
    await sendTxWithNonce(badgeSystem, "setFactory", [circleFactoryAddress]);
    await sendTxWithNonce(badgeSystem, "transferOwnership", [circleFactoryAddress]);
    
    console.log("🔐 Transferring CircleFactory ownership to CircleDeployer...");
    await sendTxWithNonce(circleFactory, "transferOwnership", [circleDeployerAddress]);
    
    console.log("\n🚀 Creating test circle via CircleDeployer...");
    const contributionAmount = ethers.parseEther("0.00000000001");
    const period = 604800; // 7 days

    const deployerReceipt = await sendTxWithNonce(
      circleDeployer,
      "deployAndRegisterCircle",
      ["Family Savings", ethers.parseEther("1.0"), contributionAmount, period, deployer.address, false],
      { value: 0 }
    );

    const circleCreatedTopic = circleFactory.interface.getEvent("CircleCreated").topicHash;
    const log = deployerReceipt.logs.find(x => x.topics[0] === circleCreatedTopic);
    
    if (!log) throw new Error("CircleCreated event not found");
    
    const parsedLog = circleFactory.interface.parseLog(log);
    const circleId = parsedLog.args.circleId;
    const engineAddress = parsedLog.args.engine;
    
    const circleData = await circleFactory.getCircle(circleId);
    const governanceAddress = circleData.governance;
    const trackerAddress = circleData.tracker;

    console.log("\n💰 Making a test contribution to the new circle...");
    const engine = await ethers.getContractAt("ContributionEngine", engineAddress);
    await sendTxWithNonce(engine, "contribute", [], { value: contributionAmount });
    console.log("✅ Test contribution successful!");

    const badgeSystemContract = await ethers.getContractAt("BadgeSystem", badgeSystemAddress);
    
    const hasContributionBadge = await badgeSystemContract.hasBadge(deployer.address, circleId, 2);
    if (hasContributionBadge) {
      console.log("✅ Milestone Contributor badge (ID 2) successfully minted for deployer!");
    } else {
      console.log("❌ Milestone Contributor badge (ID 2) was not minted.");
    }

    console.log("\n🏛️ Testing Governance Badge minting...");
    const governanceContract = await ethers.getContractAt("CircleGovernance", governanceAddress);

    console.log("➡️ Creating a test proposal...");
    await sendTxWithNonce(governanceContract, "createProposal", [
      1, // ProposalType.DONATION
      "Test Donation",
      "Donate 0.01 BTC to a charity.",
      ethers.parseEther("0.01"),
      "0xeB4F0Cb1644FA1f6dd01Aa2F7c49099d2267F3A8"
    ]);

    console.log("➡️ Voting 'yes' on the proposal...");
    await sendTxWithNonce(governanceContract, "vote", [1, true]);

    // FIX: Only attempt to manipulate time on the local hardhat network
    if (network.name === "hardhat" || network.name === "localhost") {
        console.log("⏳ Simulating time passing (4 days) on local network...");
        await network.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await network.provider.send("evm_mine");

        console.log("➡️ Executing the proposal...");
        await sendTxWithNonce(governanceContract, "executeProposal", [1]);
        
        const hasGovernanceBadge = await badgeSystemContract.hasBadge(deployer.address, circleId, 3);
        if (hasGovernanceBadge) {
            console.log("✅ Circle Governor badge (ID 3) successfully minted for deployer!");
        } else {
            console.log("❌ Circle Governor badge (ID 3) was not minted.");
        }
    } else {
        console.log(`\n✅ Proposal created and voted on network: ${network.name}.`);
        console.log("🕒 Please wait for the voting period (3 days) and execution delay (1 day) to pass.");
        console.log(`Then, manually call 'executeProposal(1)' on the governance contract at ${governanceAddress}.`);
    }

    // Save config file
    const config = {
      network: network.name,
      deployerContractAddress: circleDeployerAddress,
      circleFactory: circleFactoryAddress,
      badgeSystem: badgeSystemAddress,
      btcOracle: btcTimestampMockAddress,
      treasury: treasuryAddress,
      semaphore: await semaphoreMock.getAddress(),
      stackToken: await stackToken.getAddress(),
      lendingPool: await lendingPool.getAddress(),
      testCircle: {
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
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });