import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import cors from 'cors';
import { createRequire } from 'module';
import { Mutex } from 'async-mutex';

const require = createRequire(import.meta.url);
// NEW: Import the CircleDeployer ABI
const CircleDeployerABI = require('./artifacts/CircleDeployer.json');

const txMutex = new Mutex();

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// UPDATED: We only need the Deployer's address now from the env
const { OWNER_PRIVATE_KEY, CITREA_RPC_URL } = process.env;
const DEPLOYER_CONTRACT_ADDRESS='0xB38dC6a6B849fc745FE9eE961064DAf9213A77cd';

if (!OWNER_PRIVATE_KEY || !CITREA_RPC_URL || !DEPLOYER_CONTRACT_ADDRESS) {
  console.error("🔥 Missing required environment variables. Check for DEPLOYER_CONTRACT_ADDRESS.");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(CITREA_RPC_URL);
const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

console.log(`✅ Backend wallet address: ${wallet.address}`);

app.use(cors());
app.use(express.json());

// 4. Define API Route for Creating a Circle
app.post('/api/create-circle', async (req, res) => {
  await txMutex.runExclusive(async () => {
    console.log("Received request to create circle:", req.body);
    
    const { name, goal, amount, period, circleOwner, isPremium } = req.body;

    if (!name || !goal || !amount || !period || !circleOwner) {
      return res.status(400).json({ success: false, error: 'Missing required parameters.' });
    }

    if (isPremium) {
      const requiredFee = ethers.parseEther("0.01");
      if (req.body.amount <= requiredFee) {
        return res.status(400).json({ error: 'Insufficient premium fee' });
      }
    }

    try {
      // Connect to the CircleDeployer contract
      const circleDeployer = new ethers.Contract(DEPLOYER_CONTRACT_ADDRESS, CircleDeployerABI.abi, wallet);

      console.log("🚀 Calling the CircleDeployer contract...");

      // Make a SINGLE transaction call to the deployer contract
      const tx = await circleDeployer.deployAndRegisterCircle(
        name,
        ethers.parseEther(goal.toString()),
        ethers.parseEther(amount.toString()),
        period,
        circleOwner,
        isPremium,
        { value: isPremium ? ethers.parseEther("0.01") : "0" }
      );

      // Wait for the single transaction to be mined
      await tx.wait();
      
      console.log(`🎉 Circle deployed and initialized successfully! Tx Hash: ${tx.hash}`);

      res.status(200).json({
        success: true,
        message: 'Circle created and initialized successfully!',
        txHash: tx.hash
      });

    } catch (error) {
      console.error("🔥 Backend circle creation failed:", error);
      res.status(500).json({ 
          success: false, 
          error: 'An error occurred on the server while creating the circle.' 
      });
    }
  });
});

// 5. Start the Server
app.listen(PORT, () => {
  console.log(`🟢 Server is running on http://localhost:${PORT}`);
});