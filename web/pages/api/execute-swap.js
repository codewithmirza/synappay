import { ethers } from 'ethers';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      ethAddress,
      stellarPublicKey,
      swapType,
      contractAddress,
      slippage = 1
    } = req.body;

    // Validate required parameters
    if (!fromToken || !toToken || !fromAmount || !toAmount || !ethAddress || !stellarPublicKey || !contractAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate HTLC secret and hashlock
    const secret = crypto.randomBytes(32);
    const hashlock = ethers.keccak256(secret);
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    console.log('🔄 Executing cross-chain swap...');
    console.log(`📊 Swap Type: ${swapType}`);
    console.log(`💰 Amount: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`);
    console.log(`🔗 Hashlock: ${hashlock}`);
    console.log(`⏰ Timelock: ${timelock}`);

    // Initialize providers
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Get HTLC contract
    const htlcABI = [
      'function newContract(address receiver, bytes32 hashlock, uint256 timelock) external payable returns (bytes32 contractId)',
      'function withdraw(bytes32 contractId, bytes32 preimage) external returns (bool)',
      'function refund(bytes32 contractId) external returns (bool)',
      'function getContract(bytes32 contractId) external view returns (address sender, address receiver, uint256 amount, bytes32 hashlock, uint256 timelock, bool withdrawn, bool refunded, bytes32 preimage)'
    ];

    const htlcContract = new ethers.Contract(contractAddress, htlcABI, wallet);

    // Calculate contract ID
    const contractId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'string', 'uint256', 'bytes32', 'uint256'],
        [ethAddress, stellarPublicKey, ethers.parseEther(fromAmount), hashlock, timelock]
      )
    );

    let swapResult;

    if (swapType === 'ETH_TO_STELLAR') {
      // ETH → Stellar swap
      swapResult = await executeEthToStellarSwap(
        htlcContract,
        contractId,
        stellarPublicKey,
        hashlock,
        timelock,
        fromAmount,
        toAmount,
        secret
      );
    } else if (swapType === 'STELLAR_TO_ETH') {
      // Stellar → ETH swap
      swapResult = await executeStellarToEthSwap(
        htlcContract,
        contractId,
        ethAddress,
        hashlock,
        timelock,
        fromAmount,
        toAmount,
        secret
      );
    } else {
      return res.status(400).json({ error: 'Invalid swap type' });
    }

    console.log('✅ Swap execution completed');
    console.log('📋 Swap ID:', swapResult.swapId);
    console.log('🔗 Transaction Hash:', swapResult.txHash);

    return res.status(200).json({
      success: true,
      swapId: swapResult.swapId,
      txHash: swapResult.txHash,
      hashlock: hashlock,
      secret: secret.toString('hex'),
      timelock: timelock,
      contractId: contractId,
      phase: 'ANNOUNCEMENT'
    });

  } catch (error) {
    console.error('❌ Swap execution failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function executeEthToStellarSwap(htlcContract, contractId, stellarPublicKey, hashlock, timelock, fromAmount, toAmount, secret) {
  try {
    console.log('🚀 Executing ETH → Stellar swap...');

    // For ETH → Stellar, we create HTLC on Ethereum with the Ethereum address as receiver
    // The Stellar address will be used later when the swap is completed
    const tx = await htlcContract.newContract(
      process.env.RELAYER_ADDRESS || "0x0000000000000000000000000000000000000000", // Use relayer address or zero address
      hashlock,
      timelock,
      { value: ethers.parseEther(fromAmount) }
    );

    const receipt = await tx.wait();
    console.log('✅ Ethereum HTLC created');

    // Generate swap ID
    const swapId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'uint256'],
        [contractId, receipt.blockNumber]
      )
    );

    return {
      swapId: swapId,
      txHash: receipt.hash,
      phase: 'DEPOSIT',
      stellarAddress: stellarPublicKey // Store Stellar address for later use
    };

  } catch (error) {
    throw new Error(`ETH → Stellar swap failed: ${error.message}`);
  }
}

async function executeStellarToEthSwap(htlcContract, contractId, ethAddress, hashlock, timelock, fromAmount, toAmount, secret) {
  try {
    console.log('🚀 Executing Stellar → ETH swap...');

    // For Stellar → ETH, we need to create HTLC on Stellar first
    // This would require Stellar SDK integration
    // For now, we'll create the Ethereum HTLC for the receiver

    const tx = await htlcContract.newContract(
      ethAddress,
      hashlock,
      timelock,
      { value: ethers.parseEther(toAmount) }
    );

    const receipt = await tx.wait();
    console.log('✅ Ethereum HTLC created for Stellar → ETH swap');

    // Generate swap ID
    const swapId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'uint256'],
        [contractId, receipt.blockNumber]
      )
    );

    return {
      swapId: swapId,
      txHash: receipt.hash,
      phase: 'DEPOSIT'
    };

  } catch (error) {
    throw new Error(`Stellar → ETH swap failed: ${error.message}`);
  }
} 