// Import the Hardhat Runtime Environment (hre). This allows us to interact with Hardhat functions.
const hre = require("hardhat");

// Helper function to convert a number to Ethereum's smallest unit (wei)
const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether"); // Converts 'n' to wei based on "ether" units
};

async function main() {
  // Retrieve test accounts from Hardhat's local blockchain
  const [buyer, seller, inspector, lender] = await ethers.getSigners();

  // Deploy the Real Estate contract
  const RealEstate = await ethers.getContractFactory("RealEstate"); // Get the contract factory
  const realEstate = await RealEstate.deploy(); // Deploy the contract
  await realEstate.waitForDeployment(); // Ensure deployment is completed

  console.log(`Deployed Real Estate Contract at: ${realEstate.target}`);
  console.log(`Minting 3 properties...\n`);

  // Mint 3 NFTs representing real estate properties
  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate
      .connect(seller) // Seller mints the properties
      .mint(
        `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${
          i + 1
        }.json`
      ); // Metadata URL for the NFT
    await transaction.wait(); // Wait for the transaction to be confirmed
  }

  // Deploy the Escrow contract
  const Escrow = await ethers.getContractFactory("Escrow"); // Get the contract factory
  const escrow = await Escrow.deploy(
    lender.address, // Lender's address
    inspector.address, // Inspector's address
    realEstate.target, // Address of the deployed Real Estate contract
    seller.address // Seller's address
  );
  await escrow.waitForDeployment(); // Ensure deployment is completed

  console.log(`Deployed Escrow Contract at: ${escrow.target}`);
  console.log(`Listing 3 properties...\n`);

  // Approve escrow contract to manage the properties
  for (let i = 0; i < 3; i++) {
    let transaction = await realEstate
      .connect(seller) // Seller grants approval
      .approve(escrow.target, i + 1); // Approve escrow contract to handle the property
    await transaction.wait(); // Wait for confirmation
  }

  // List properties for sale on the escrow contract
  transaction = await escrow
    .connect(seller) // Seller lists the property
    .list(
      1, // Property ID
      buyer.address, // Buyer’s address
      tokens(20), // Purchase price (20 ETH)
      tokens(10) // Earnest deposit (10 ETH)
    );
  await transaction.wait(); // Wait for confirmation

  transaction = await escrow
    .connect(seller)
    .list(2, buyer.address, tokens(15), tokens(5)); // Property 2: Price = 15 ETH, Deposit = 5 ETH
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(3, buyer.address, tokens(10), tokens(5)); // Property 3: Price = 10 ETH, Deposit = 5 ETH
  await transaction.wait();

  console.log(`Finished.`);
}

// Proper error handling: If `main()` fails, catch the error and exit the process
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
