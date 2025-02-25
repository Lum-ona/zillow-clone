// Import Chai's 'expect' function for assertion testing
const { expect } = require("chai");

// Import 'ethers' from Hardhat to interact with the Ethereum blockchain
const { ethers } = require("hardhat");

// Helper function to convert a number to Wei (smallest unit of Ether)
const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

// Define the test suite for the 'Escrow' contract
describe("Escrow", () => {
  let buyer, seller, inspector, lender; // Define variables for different signers (accounts)
  let realEstate, escrow; // Define variables for contract instances

  // Runs before each test case in this suite
  beforeEach(async () => {
    // Get the test accounts from Hardhat's Ethereum test environment
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy the 'RealEstate' contract
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // Mint a new NFT (representing property) for the seller
    let transaction = await realEstate
      .connect(seller) // Connect as the seller
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      ); // Metadata URL of the property
    await transaction.wait(); // Wait for minting transaction confirmation

    // Deploy the 'Escrow' contract with required addresses
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      lender.address, // Lender's wallet address
      inspector.address, // Inspector's wallet address
      realEstate.target, // Address of the deployed 'RealEstate' contract (NFT contract)
      seller.address // Seller's wallet address
    );

    // Approve the escrow contract to manage the seller's NFT
    transaction = await realEstate.connect(seller).approve(escrow.target, 1);
    await transaction.wait(); // Wait for approval transaction confirmation

    // List the property on the escrow contract
    transaction = await escrow
      .connect(seller) // Connect as seller
      .list(
        1, // NFT ID of the property
        buyer.address, // Buyer's address
        tokens(10), // Purchase price (10 Ether)
        tokens(5) // Escrow deposit amount (5 Ether)
      );
    await transaction.wait(); // Wait for the listing transaction confirmation
  });

  // Test contract deployment
  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const result = await escrow.nftAddress(); // Fetch NFT contract address
      expect(result).to.be.equal(realEstate.target); // Ensure it matches RealEstate contract
    });
    it("Returns seller", async () => {
      const result = await escrow.seller(); // Fetch seller's address
      expect(result).to.be.equal(seller.address);
    });
    it("Returns inspector", async () => {
      const result = await escrow.inspector(); // Fetch inspector's address
      expect(result).to.be.equal(inspector.address);
    });
    it("Returns lender", async () => {
      const result = await escrow.lender(); // Fetch lender's address
      expect(result).to.be.equal(lender.address);
    });
  });

  // Test property listing functionality
  describe("Listing", () => {
    it("Updates as listed", async () => {
      const result = await escrow.isListed(1); // Check if property is listed
      expect(result).to.be.equal(true);
    });
    it("Returns buyer", async () => {
      const result = await escrow.buyer(1); // Fetch assigned buyer's address
      expect(result).to.be.equal(buyer.address);
    });
    it("Returns purchase price", async () => {
      const result = await escrow.purchasePrice(1); // Fetch property price
      expect(result).to.be.equal(tokens(10));
    });
    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1); // Fetch escrow deposit amount
      expect(result).to.be.equal(tokens(5));
    });
    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.target); // Ensure escrow contract holds the NFT
    });
  });

  // Test deposit functionality
  describe("Deposits", () => {
    beforeEach(async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) }); // Buyer deposits 5 ETH as escrow
      await transaction.wait(); // Wait for transaction confirmation
    });
    it("Updates contract balance", async () => {
      const result = await escrow.getBalance(); // Fetch contract balance
      expect(result).to.be.equal(tokens(5)); // Ensure it matches deposited amount
    });
  });

  // Test inspection status update
  describe("Inspection", () => {
    beforeEach(async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true); // Inspector approves the property
      await transaction.wait();
    });
    it("Updates inspection status", async () => {
      const result = await escrow.inspectionPassed(1);
      expect(result).to.be.equal(true);
    });
  });

  // Test sale approval process
  describe("Approval", () => {
    beforeEach(async () => {
      await escrow.connect(buyer).approveSale(1); // Buyer approves
      await escrow.connect(seller).approveSale(1); // Seller approves
      await escrow.connect(lender).approveSale(1); // Lender approves
    });
    it("Updates approval status", async () => {
      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  // Test final sale execution
  describe("Sale", () => {
    beforeEach(async () => {
      await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
      await escrow.connect(inspector).updateInspectionStatus(1, true);
      await escrow.connect(buyer).approveSale(1);
      await escrow.connect(seller).approveSale(1);
      await escrow.connect(lender).approveSale(1);
      await lender.sendTransaction({ to: escrow.target, value: tokens(5) }); // Lender funds the remaining amount
      await escrow.connect(seller).finalizeSale(1); // Seller finalizes the sale
    });
    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address); // Ensure buyer owns the NFT
    });
    it("Updates balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0); // Ensure contract balance is 0
    });
  });
});
