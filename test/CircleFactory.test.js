const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CircleFactory", function () {
  let factory, btcOracle, owner, addr1;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const BtcOracle = await ethers.getContractFactory("BtcTimestampMock");
    btcOracle = await BtcOracle.deploy();
    await btcOracle.deployed();
    
    const CircleFactory = await ethers.getContractFactory("CircleFactory");
    factory = await CircleFactory.deploy(btcOracle.address);
    await factory.deployed();
  });
  
  it("Should deploy a new circle", async function () {
    const tx = await factory.createCircle("Test Circle", 100, 10, 604800);
    await tx.wait();
    
    const circleId = await factory.circleCount();
    const circle = await factory.getCircle(circleId);
    
    expect(circle.goal).to.equal(100);
    expect(await factory.ownerOf(circleId)).to.equal(owner.address);
  });
  
  it("Should emit CircleCreated event", async function () {
    await expect(factory.createCircle("Test Circle", 100, 10, 604800))
      .to.emit(factory, "CircleCreated")
      .withArgs(
        1, 
        owner.address, 
        ethers.utils.getAddress, 
        ethers.utils.getAddress, 
        100
      );
  });
});