require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const CITREA_RPC = process.env.CITREA_RPC || "https://rpc.testnet.citrea.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    citrea: {
      url: CITREA_RPC,
      chainId: 5115,
      accounts: [PRIVATE_KEY],
    },
  },
  mocha: {
    timeout: 40000
  }
};