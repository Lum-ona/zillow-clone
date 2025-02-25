# Real Estate NFT & Escrow Smart Contracts

## Overview

This project introduces a blockchain-based real estate transaction system using NFTs (Non-Fungible Tokens) and an escrow smart contract. The **RealEstate** smart contract allows users to mint and manage NFTs representing real estate properties. The **Escrow** smart contract facilitates secure property transactions by ensuring all conditions are met before finalizing the sale.

## Features

- **Real Estate Tokenization:** Converts real estate properties into ERC721 NFTs.
- **Escrow Mechanism:** Ensures secure transactions between buyer and seller.
- **Inspection Process:** Allows an inspector to verify property status.
- **Approval System:** Requires approval from buyer, seller, and lender before transferring ownership.
- **Secure Fund Handling:** Holds purchase funds in escrow until all conditions are met.

## Smart Contracts

### RealEstate.sol

This contract handles the creation and storage of real estate NFTs.

#### Functions:

- `mint(string memory tokenURI)`: Mints a new real estate NFT with metadata URI.
- `totalSupply()`: Returns the total number of minted NFTs.

### Escrow.sol

This contract manages the secure sale of real estate NFTs using an escrow mechanism.

#### Key Roles:

- **Seller**: Lists the property for sale.
- **Buyer**: Places an earnest deposit and completes the purchase.
- **Lender**: Approves the transaction if financing is involved.
- **Inspector**: Verifies the property condition.

#### Functions:

- `list(uint256 _nftID, address _buyer, uint256 _purchasePrice, uint256 _escrowAmount)`: Lists an NFT for sale.
- `depositEarnest(uint256 _nftID)`: Buyer deposits earnest money.
- `updateInspectionStatus(uint256 _nftID, bool _passed)`: Inspector updates inspection status.
- `approveSale(uint256 _nftID)`: Participants approve the sale.
- `finalizeSale(uint256 _nftID)`: Transfers NFT and funds upon approval.
- `cancelSale(uint256 _nftID)`: Cancels the transaction and refunds accordingly.
- `getBalance()`: Returns contract balance.

## Deployment

### Prerequisites:

- Node.js & npm
- Hardhat (Ethereum development framework)
- MetaMask (for testing on testnets)

### Steps:

1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd real-estate-nft
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Compile the smart contracts:
   ```sh
   npx hardhat compile
   ```
4. Deploy to a testnet (e.g., Goerli):
   ```sh
   npx hardhat run scripts/deploy.js --network goerli
   ```

## Usage

1. **Mint an NFT** using `mint(tokenURI)`.
2. **List the property** for sale via `list(nftID, buyer, purchasePrice, escrowAmount)`.
3. **Deposit earnest money** using `depositEarnest(nftID)`.
4. **Complete inspection** through `updateInspectionStatus(nftID, true/false)`.
5. **Approve the sale** from buyer, seller, and lender.
6. **Finalize transaction** via `finalizeSale(nftID)`.
7. **Cancel the sale** if needed using `cancelSale(nftID)`.

## Security Considerations

- Ensure private key security when deploying.
- Use only verified smart contract addresses.
- Implement additional safeguards against front-running attacks.

## License

This project is licensed under the [MIT License](LICENSE).

## Author

Developed by **Electrixitaty**. Reach out for contributions and improvements!
