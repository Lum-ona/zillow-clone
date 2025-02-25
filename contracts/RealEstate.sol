//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// Importing Counters utility from OpenZeppelin to keep track of token IDs
import "@openzeppelin/contracts/utils/Counters.sol";

// Importing ERC721 standard implementation from OpenZeppelin (base NFT contract)
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Importing an extension of ERC721 that allows storing metadata (URI) for each token
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


contract RealEstate is ERC721URIStorage {
    // Using the Counters library for managing token IDs
    using Counters for Counters.Counter;
    
    // Private counter to keep track of token IDs
    Counters.Counter private _tokenIds;

    // Constructor function to set the NFT name as "Real Estate" and symbol as "REAL"
    constructor() ERC721("Real Estate", "REAL") {}

    // Function to mint a new NFT
    function mint(string memory tokenURI) public returns (uint256) {
        // Incrementing the token ID counter before minting a new token
        _tokenIds.increment();

        // Getting the current token ID
        uint256 newItemId = _tokenIds.current();

        // Minting the new NFT and assigning it to the sender's address
        _mint(msg.sender, newItemId);

        // Assigning a metadata URI to the newly minted token
        _setTokenURI(newItemId, tokenURI);

        // Returning the new token ID
        return newItemId;
    }

    // Function to return the total number of NFTs minted so far
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
