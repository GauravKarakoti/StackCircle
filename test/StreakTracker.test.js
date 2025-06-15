const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StreakTracker", function () {
  let tracker, engine, owner, addr1;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Deploy mock engine
    const ContributionEngine = await ethers.getContractFactory("ContributionEngine");
    engine = await ContributionEngine.deploy(
      "Test Circle",
      ethers.utils.parseEther("0.01"),
      604800, // 7 days
      owner.address // mock oracle
    );
    await engine.deployed();
    
    // Deploy StreakTracker
    const StreakTracker = await ethers.getContractFactory("StreakTracker");
    tracker = await StreakTracker.deploy();
    await tracker.deployed();
    
    // Set up relationship
    await tracker.setEngine(engine.address);
    await engine.setStreakTracker(tracker.address);
  });
  
  it("Should initialize streaks to zero", async function () {
    const streak = await tracker.streaks(addr1.address);
    expect(streak.current).to.equal(0);
    expect(streak.longest).to.equal(0);
  });
  
  it("Should update streak on contribution", async function () {
    // Simulate contribution
    await tracker.recordContribution(addr1.address);
    
    const streak = await tracker.streaks(addr1.address);
    expect(streak.current).to.equal(1);
    expect(streak.longest).to.equal(1);
  });
  
  it("Should increment streak for consecutive contributions", async function () {
    // First contribution
    await tracker.recordContribution(addr1.address);
    
    // Second contribution
    await tracker.recordContribution(addr1.address);
    
    const streak = await tracker.streaks(addr1.address);
    expect(streak.current).to.equal(2);
    expect(streak.longest).to.equal(2);
  });
  
  it("Should reset streak after missing period", async function () {
    // First contribution
    await tracker.recordContribution(addr1.address);
    
    // Fast forward time (2 weeks)
    await ethers.provider.send("evm_increaseTime", [1209600]);
    await ethers.provider.send("evm_mine");
    
    // Second contribution
    await tracker.recordContribution(addr1.address);
    
    const streak = await tracker.streaks(addr1.address);
    expect(streak.current).to.equal(1);
    expect(streak.longest).to.equal(1);
  });
  
  it("Should maintain longest streak record", async function () {
    // Create 5-day streak
    for (let i = 0; i < 5; i++) {
      await tracker.recordContribution(addr1.address);
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");
    }
    
    // Skip 2 weeks
    await ethers.provider.send("evm_increaseTime", [1209600]);
    await ethers.provider.send("evm_mine");
    
    // New streak of 3
    for (let i = 0; i < 3; i++) {
      await tracker.recordContribution(addr1.address);
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");
    }
    
    const streak = await tracker.streaks(addr1.address);
    expect(streak.current).to.equal(3);
    expect(streak.longest).to.equal(5);
  });
});