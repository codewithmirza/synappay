const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying EthereumHTLC contract...");

    // Get the contract factory
    const EthereumHTLC = await ethers.getContractFactory("EthereumHTLC");

    // Deploy the contract
    const htlc = await EthereumHTLC.deploy();
    await htlc.waitForDeployment();

    const contractAddress = await htlc.getAddress();
    console.log("EthereumHTLC deployed to:", contractAddress);

    // Verify deployment
    console.log("Verifying deployment...");
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
        console.error("Contract deployment failed - no code at address");
        process.exit(1);
    }

    console.log("✅ Contract deployed successfully!");
    console.log("Contract address:", contractAddress);
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Deployer:", await htlc.runner.getAddress());

    // Save deployment info
    const deploymentInfo = {
        contractAddress: contractAddress,
        network: (await ethers.provider.getNetwork()).name,
        deployer: await htlc.runner.getAddress(),
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber()
    };

    console.log("\nDeployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    return contractAddress;
}

// Run deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;