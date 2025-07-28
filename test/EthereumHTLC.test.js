const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("EthereumHTLC", function () {
    let htlc;
    let owner, receiver, other;
    let secret, hashlock;
    let timelock;

    beforeEach(async function () {
        [owner, receiver, other] = await ethers.getSigners();

        // Deploy contract
        const EthereumHTLC = await ethers.getContractFactory("EthereumHTLC");
        htlc = await EthereumHTLC.deploy();
        await htlc.waitForDeployment();

        // Generate secret and hashlock
        secret = crypto.randomBytes(32);
        hashlock = '0x' + crypto.createHash('sha256').update(secret).digest('hex');
        
        // Set timelock to 1 hour from current block timestamp
        const currentBlock = await ethers.provider.getBlock('latest');
        timelock = currentBlock.timestamp + 3600;
    });

    describe("Contract Creation", function () {
        it("Should create a new HTLC contract", async function () {
            const amount = ethers.parseEther("1.0");
            
            const tx = await htlc.connect(owner).newContract(
                receiver.address,
                hashlock,
                timelock,
                { value: amount }
            );

            const receipt = await tx.wait();
            const event = receipt.logs[0];
            
            expect(event.eventName).to.equal("HTLCNew");
            
            // Get contract details
            const contractId = event.args[0];
            const contractDetails = await htlc.getContract(contractId);
            
            expect(contractDetails[0]).to.equal(owner.address); // sender
            expect(contractDetails[1]).to.equal(receiver.address); // receiver
            expect(contractDetails[2]).to.equal(amount); // amount
            expect(contractDetails[3]).to.equal(hashlock); // hashlock
            expect(contractDetails[4]).to.equal(timelock); // timelock
            expect(contractDetails[5]).to.equal(false); // withdrawn
            expect(contractDetails[6]).to.equal(false); // refunded
        });

        it("Should fail with zero value", async function () {
            await expect(
                htlc.connect(owner).newContract(
                    receiver.address,
                    hashlock,
                    timelock,
                    { value: 0 }
                )
            ).to.be.revertedWith("msg.value must be > 0");
        });

        it("Should fail with past timelock", async function () {
            const currentBlock = await ethers.provider.getBlock('latest');
            const pastTimelock = currentBlock.timestamp - 3600;
            
            await expect(
                htlc.connect(owner).newContract(
                    receiver.address,
                    hashlock,
                    pastTimelock,
                    { value: ethers.parseEther("1.0") }
                )
            ).to.be.revertedWith("timelock time must be in the future");
        });
    });

    describe("Withdrawal", function () {
        let contractId;
        const amount = ethers.parseEther("1.0");

        beforeEach(async function () {
            const tx = await htlc.connect(owner).newContract(
                receiver.address,
                hashlock,
                timelock,
                { value: amount }
            );
            const receipt = await tx.wait();
            contractId = receipt.logs[0].args[0];
        });

        it("Should allow receiver to withdraw with correct preimage", async function () {
            const initialBalance = await ethers.provider.getBalance(receiver.address);
            
            const tx = await htlc.connect(receiver).withdraw(contractId, '0x' + secret.toString('hex'));
            const receipt = await tx.wait();
            
            // Check event
            const event = receipt.logs[0];
            expect(event.eventName).to.equal("HTLCWithdraw");
            expect(event.args[0]).to.equal(contractId);
            
            // Check balance change
            const finalBalance = await ethers.provider.getBalance(receiver.address);
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            expect(finalBalance).to.equal(initialBalance + amount - gasUsed);
            
            // Check contract state
            const contractDetails = await htlc.getContract(contractId);
            expect(contractDetails[5]).to.equal(true); // withdrawn
            expect(contractDetails[7]).to.equal('0x' + secret.toString('hex')); // preimage
        });

        it("Should fail with wrong preimage", async function () {
            const wrongSecret = crypto.randomBytes(32);
            
            await expect(
                htlc.connect(receiver).withdraw(contractId, '0x' + wrongSecret.toString('hex'))
            ).to.be.revertedWith("hashlock hash does not match");
        });

        it("Should fail if not receiver", async function () {
            await expect(
                htlc.connect(other).withdraw(contractId, secret)
            ).to.be.revertedWith("withdrawable: not receiver");
        });

        it("Should fail after timelock expires", async function () {
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await expect(
                htlc.connect(receiver).withdraw(contractId, '0x' + secret.toString('hex'))
            ).to.be.revertedWith("withdrawable: timelock time must be in the future");
        });
    });

    describe("Refund", function () {
        let contractId;
        const amount = ethers.parseEther("1.0");

        beforeEach(async function () {
            // Get current block timestamp and add 1 hour
            const currentBlock = await ethers.provider.getBlock('latest');
            const freshTimelock = currentBlock.timestamp + 3600;
            
            const tx = await htlc.connect(owner).newContract(
                receiver.address,
                hashlock,
                freshTimelock,
                { value: amount }
            );
            const receipt = await tx.wait();
            contractId = receipt.logs[0].args[0];
        });

        it("Should allow sender to refund after timelock", async function () {
            // Fast forward time past timelock
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            const tx = await htlc.connect(owner).refund(contractId);
            const receipt = await tx.wait();
            
            // Check event
            const event = receipt.logs[0];
            expect(event.eventName).to.equal("HTLCRefund");
            expect(event.args[0]).to.equal(contractId);
            
            // Check balance change
            const finalBalance = await ethers.provider.getBalance(owner.address);
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            expect(finalBalance).to.equal(initialBalance + amount - gasUsed);
            
            // Check contract state
            const contractDetails = await htlc.getContract(contractId);
            expect(contractDetails[6]).to.equal(true); // refunded
        });

        it("Should fail before timelock expires", async function () {
            await expect(
                htlc.connect(owner).refund(contractId)
            ).to.be.revertedWith("refundable: timelock not yet passed");
        });

        it("Should fail if not sender", async function () {
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await expect(
                htlc.connect(other).refund(contractId)
            ).to.be.revertedWith("refundable: not sender");
        });

        it("Should fail if already withdrawn", async function () {
            // First withdraw
            await htlc.connect(receiver).withdraw(contractId, '0x' + secret.toString('hex'));
            
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await expect(
                htlc.connect(owner).refund(contractId)
            ).to.be.revertedWith("refundable: already withdrawn");
        });
    });

    describe("Contract Queries", function () {
        it("Should return empty data for non-existent contract", async function () {
            const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
            const contractDetails = await htlc.getContract(fakeId);
            
            expect(contractDetails[0]).to.equal(ethers.ZeroAddress); // sender
            expect(contractDetails[1]).to.equal(ethers.ZeroAddress); // receiver
            expect(contractDetails[2]).to.equal(0); // amount
        });
    });
});