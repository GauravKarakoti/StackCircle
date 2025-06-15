const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ContributionEngine", function () {
  let engine, btcOracle, owner, addr1;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Deploy mock BTC Timestamp Oracle
    const BtcOracle = await ethers.getContractFactory("BtcTimestampMock");
    btcOracle = await BtcOracle.deploy();
    await btcOracle.deployed();
    
    // Deploy ContributionEngine
    const ContributionEngine = await ethers.getContractFactory("ContributionEngine");
    engine = await ContributionEngine.deploy(
      "Test Circle",
      ethers.utils.parseEther("0.01"), // 0.01 BTC
      604800, // 7 days in seconds
      btcOracle.address
    );
    await engine.deployed();
  });
  
  it("Should set initial values correctly", async function () {
    expect(await engine.name()).to.equal("Test Circle");
    expect(await engine.contributionAmount()).to.equal(ethers.utils.parseEther("0.01"));
    expect(await engine.contributionPeriod()).to.equal(604800);
  });
  
  it("Should allow owner to add members", async function () {
    await engine.addMember(addr1.address);
    const member = await engine.members(addr1.address);
    expect(member.exists).to.be.true;
  });
  
  it("Should prevent non-owners from adding members", async function () {
    await expect(
      engine.connect(addr1).addMember(addr1.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
  
  it("Should allow members to contribute", async function () {
    await engine.addMember(addr1.address);
    
    await expect(
      engine.connect(addr1).contribute({ 
        value: ethers.utils.parseEther("0.01") 
      })
    ).to.emit(engine, "ContributionMade");
  });
  
  it("Should prevent non-members from contributing", async function () {
    await expect(
      engine.connect(addr1).contribute({ 
        value: ethers.utils.parseEther("0.01") 
      })
    ).to.be.revertedWith("Not member");
  });
  
  it("Should prevent incorrect contribution amounts", async function () {
    await engine.addMember(addr1.address);
    
    await expect(
      engine.connect(addr1).contribute({ 
        value: ethers.utils.parseEther("0.02") 
      })
    ).to.be.revertedWith("Incorrect amount");
  });
  
  it("Should update member stats after contribution", async function () {
    await engine.addMember(addr1.address);
    
    await engine.connect(addr1).contribute({ 
      value: ethers.utils.parseEther("0.01") 
    });
    
    const member = await engine.members(addr1.address);
    expect(member.totalContributed).to.equal(ethers.utils.parseEther("0.01"));
    expect(member.lastContribution).to.be.gt(0);
  });
  
  it("Should call streak tracker after contribution", async function () {
    // Deploy and set up streak tracker
    const StreakTracker = await ethers.getContractFactory("StreakTracker");
    const tracker = await StreakTracker.deploy();
    await tracker.deployed();
    await tracker.setEngine(engine.address);
    await engine.setStreakTracker(tracker.address);
    
    await engine.addMember(addr1.address);
    
    await engine.connect(addr1).contribute({ 
      value: ethers.utils.parseEther("0.01") 
    });
    
    const streak = await tracker.streaks(addr1.address);
    expect(streak.current).to.equal(1);
  });
});