import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

// Faucet configuration
const FAUCET_AMOUNT = 0.1; // 0.1 cBTC
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
const CITREA_RPC_URL = process.env.CITREA_RPC_URL;

if (!FAUCET_PRIVATE_KEY || !CITREA_RPC_URL) {
  console.error("🔥 Missing required environment variables for faucet");
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { address } = await request.json();
    
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Connect to Citrea testnet
    const provider = new ethers.JsonRpcProvider(CITREA_RPC_URL);
    const faucetWallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);
    
    // Check faucet balance
    const faucetBalance = await provider.getBalance(faucetWallet.address);
    const faucetBalanceEth = ethers.formatEther(faucetBalance);
    
    if (parseFloat(faucetBalanceEth) < FAUCET_AMOUNT) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Faucet low on funds (${faucetBalanceEth} BTC remaining)` 
        },
        { status: 500 }
      );
    }
    
    // Send cBTC
    const tx = await faucetWallet.sendTransaction({
      to: address,
      value: ethers.parseEther(FAUCET_AMOUNT.toString())
    });
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully sent ${FAUCET_AMOUNT} test BTC to ${address}`,
      txHash: tx.hash
    });
    
  } catch (error) {
    console.error('Faucet error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send test BTC' 
      },
      { status: 500 }
    );
  }
}