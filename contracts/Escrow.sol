// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// Interface for ERC721 (NFT) functionality
interface IERC721 {
   function transferFrom(
    address from,
    address to,
    uint256 tokenId
) external;
}

// Smart contract for handling escrow transactions of NFTs
contract Escrow {
    // Public addresses for key participants in the escrow process
    address public lender; // The lender providing funds for purchase
    address public inspector; // Inspector responsible for property inspection
    address public nftAddress; // Address of the NFT contract
    address payable public seller; // The seller of the NFT

    // Modifier to allow only the buyer of a specific NFT to call a function
    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    // Modifier to allow only the seller to call a function
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    // Modifier to allow only the inspector to call a function
    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    // Mappings to store escrow data
    mapping(uint256 => bool) public isListed; // Tracks if NFT is listed for sale
    mapping(uint256 => uint256) public purchasePrice; // Stores NFT purchase price
    mapping(uint256 => uint256) public escrowAmount; // Stores required escrow deposit
    mapping(uint256 => address) public buyer; // Maps NFT ID to buyer's address
    mapping(uint256 => bool) public inspectionPassed; // Tracks inspection status
    mapping(uint256 => mapping(address => bool)) public approval; // Approval tracking

    // Constructor to initialize contract with key participant addresses
    constructor(
        address _lender,
        address _inspector,
        address _nftAddress,
        address payable _seller
    ) {
        lender = _lender;
        seller = _seller;
        inspector = _inspector;
        nftAddress = _nftAddress;
    }

    // Function to list an NFT for sale (only seller can call)
    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        // Transfer NFT from seller to escrow contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        // Update contract state
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    // Function to allow the buyer to deposit earnest money into escrow
    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(msg.value >= escrowAmount[_nftID], "Insufficient escrow amount");
    }

    // Function for the inspector to update the inspection status of an NFT
    function updateInspectionStatus(uint256 _nftID, bool _passed)
        public
        onlyInspector
    {
        inspectionPassed[_nftID] = _passed;
    }

    // Function for approving the sale by different parties
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    // Function to finalize the sale and transfer ownership and funds
    function finalizeSale(uint256 _nftID) public {
        // Ensure inspection has passed
        require(inspectionPassed[_nftID], "Inspection must be passed");
        // Ensure all required approvals are given
        require(approval[_nftID][buyer[_nftID]], "Buyer must approve");
        require(approval[_nftID][seller], "Seller must approve");
        require(approval[_nftID][lender], "Lender must approve");
        // Ensure contract balance is sufficient
        require(address(this).balance >= purchasePrice[_nftID], "Insufficient funds");

        // Mark NFT as no longer listed
        isListed[_nftID] = false;

        // Transfer funds to seller
        (bool success, ) = seller.call{value: address(this).balance}("");
        require(success, "Transfer to seller failed");

        // Transfer NFT ownership to buyer
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    // Function to cancel the sale and refund or transfer funds accordingly
    function cancelSale(uint256 _nftID) public {
        if (!inspectionPassed[_nftID]) {
            // Refund buyer if inspection failed
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            // Send funds to seller otherwise
            payable(seller).transfer(address(this).balance);
        }
    }

    // Fallback function to receive Ether payments
    receive() external payable {}

    // Function to check contract balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
