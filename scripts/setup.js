const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function setup() {
    console.log('🚀 SynapPay Setup Script\n');
    console.log('This script will help you set up your development environment.\n');
    
    // Check if .env exists
    const envPath = path.join(__dirname, '..', '.env');
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    
    if (!fs.existsSync(envPath)) {
        console.log('📝 Creating .env file from template...');
        
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            console.log('✅ .env file created');
            console.log('⚠️  Please edit .env file with your actual credentials\n');
        } else {
            console.log('❌ .env.example not found');
            return;
        }
    } else {
        console.log('✅ .env file already exists\n');
    }
    
    // Generate a new wallet if needed
    console.log('🔐 Wallet Information:');
    
    try {
        require('dotenv').config();
        
        if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
            console.log('✅ Existing wallet found');
            console.log('Address:', wallet.address);
            console.log('Private Key:', process.env.PRIVATE_KEY);
        } else {
            console.log('🆕 Generating new wallet...');
            const wallet = ethers.Wallet.createRandom();
            console.log('✅ New wallet generated');
            console.log('Address:', wallet.address);
            console.log('Private Key:', wallet.privateKey);
            console.log('\n⚠️  IMPORTANT: Update your .env file with this private key:');
            console.log(`PRIVATE_KEY=${wallet.privateKey}`);
        }
    } catch (error) {
        console.log('❌ Error with wallet setup:', error.message);
    }
    
    console.log('\n📋 Setup Checklist:');
    console.log('');
    console.log('1. ✅ .env file created');
    console.log('2. 🔄 Update .env with your credentials:');
    console.log('   - PRIVATE_KEY: Your Ethereum private key');
    console.log('   - SEPOLIA_RPC_URL: Infura/Alchemy Sepolia endpoint');
    console.log('   - ETHERSCAN_API_KEY: Etherscan API key');
    console.log('   - ONEINCH_API_KEY: 1inch API key');
    console.log('   - STELLAR_PRIVATE_KEY: Your Stellar private key');
    console.log('');
    console.log('3. 💰 Fund your accounts:');
    console.log('   - Sepolia ETH: https://sepoliafaucet.com/');
    console.log('   - Stellar XLM: https://laboratory.stellar.org/#account-creator');
    console.log('');
    console.log('4. 🧪 Test your setup:');
    console.log('   npm install');
    console.log('   npm run build');
    console.log('   npm run test');
    console.log('   npm run test:full');
    console.log('');
    console.log('5. 🚀 Deploy and test:');
    console.log('   npm run deploy:sepolia');
    console.log('   npm run cli test');
    console.log('');
    console.log('📚 Useful Resources:');
    console.log('- Infura: https://infura.io/');
    console.log('- Alchemy: https://alchemy.com/');
    console.log('- 1inch API: https://portal.1inch.dev/');
    console.log('- Stellar Laboratory: https://laboratory.stellar.org/');
    console.log('- Etherscan: https://etherscan.io/apis');
    
    console.log('\n🎉 Setup complete! Follow the checklist above to get started.');
}

setup().catch(console.error);