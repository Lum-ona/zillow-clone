import { useEffect, useState } from "react"; // Importing React hooks for managing state and side effects.
import { BrowserProvider, Contract, getAddress } from "ethers"; // Importing ethers.js utilities for interacting with Ethereum blockchain.

// Components
import Navigation from "./components/Navigation"; // Importing the Navigation component.
import Search from "./components/Search"; // Importing the Search component.
import Home from "./components/Home"; // Importing the Home component.

// ABIs (Application Binary Interfaces) for smart contracts
import RealEstate from "./abis/RealEstate.json"; // Importing the ABI for the RealEstate smart contract.
import Escrow from "./abis/Escrow.json"; // Importing the ABI for the Escrow smart contract.

// Configuration file containing contract addresses for different networks
import config from "./config.json";

function App() {
  // React state variables
  const [provider, setProvider] = useState(null); // Stores the blockchain provider instance.
  const [escrow, setEscrow] = useState(null); // Stores the escrow contract instance.
  const [account, setAccount] = useState(null); // Stores the connected user's Ethereum account.
  const [homes, setHomes] = useState([]); // Stores the list of available homes (metadata from blockchain).
  const [home, setHome] = useState({}); // Stores the currently selected home for details view.
  const [toggle, setToggle] = useState(false); // Manages the toggle state for displaying the Home component.

  useEffect(() => {
    // Function to load blockchain data
    const loadBlockchainData = async () => {
      const provider = new BrowserProvider(window.ethereum); // Creating an ethers.js provider using MetaMask.
      setProvider(provider); // Storing the provider in state.

      const network = await provider.getNetwork(); // Getting the current blockchain network.
      console.log("Network Chain ID: ", network.chainId); // Logging the network ID.

      // Checking if the network is supported in the config file
      if (!config[network.chainId]) {
        console.error(`Missing configuration for chain ID: ${network.chainId}`);
        return; // Exit function if network is unsupported.
      }

      // Requesting connected accounts from MetaMask
      const accounts = await window.ethereum.request({
        method: "eth_accounts", // Fetching available accounts (not requesting new connections).
      });

      if (accounts.length > 0) {
        const account = getAddress(accounts[0]); // Formatting the Ethereum address properly.
        setAccount(account); // Storing the connected account in state.
        console.log("Connected Account:", account); // Logging the account address.
      } else {
        console.log("No accounts connected."); // Logging if no accounts are connected.
      }

      // Initializing RealEstate smart contract instance
      const realEstate = new Contract(
        config[network.chainId].realEstate.target, // Fetching the RealEstate contract address from config.
        RealEstate, // Using the ABI of the RealEstate contract.
        provider // Connecting the contract with the blockchain provider.
      );

      const totalSupply = await realEstate.totalSupply(); // Fetching the total number of real estate NFTs.
      const homes = []; // Initializing an array to store home data.

      // Looping through each home NFT and fetching its metadata
      for (let i = 1; i <= totalSupply; i++) {
        const uri = await realEstate.tokenURI(i); // Fetching the metadata URI of the NFT.
        const response = await fetch(uri); // Fetching metadata from the URI.
        const metadata = await response.json(); // Parsing JSON metadata.
        homes.push(metadata); // Storing metadata in the homes array.
      }

      setHomes(homes); // Updating state with the fetched homes data.

      // Initializing Escrow smart contract instance
      const escrow = new Contract(
        config[network.chainId].escrow.target, // Fetching the Escrow contract address from config.
        Escrow, // Using the ABI of the Escrow contract.
        provider // Connecting the contract with the blockchain provider.
      );
      setEscrow(escrow); // Storing the escrow contract instance in state.
    };

    loadBlockchainData(); // Calling the function to load blockchain data.

    // Function to handle account changes in MetaMask
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        const account = getAddress(accounts[0]); // Formatting and storing the new account address.
        setAccount(account);
        console.log("New Connection: ", account); // Logging the new connected account.
      } else {
        setAccount(null); // Resetting account state if disconnected.
        console.log("Disconnected from MetaMask"); // Logging disconnection event.
      }
    };

    // Listening for account changes in MetaMask
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      // Cleaning up the event listener when the component unmounts
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []); // Empty dependency array ensures this effect runs only once when the component mounts.

  // Function to toggle the pop-up displaying home details
  const togglePop = (home) => {
    setHome(home); // Setting the selected home.
    toggle ? setToggle(false) : setToggle(true); // Toggling the pop-up state.
  };

  return (
    <div>
      {/* Navigation component with account details */}
      <Navigation account={account} setAccount={setAccount} />
      <Search /> {/* Search component */}
      <div className="cards__section">
        <h3>Homes For You</h3> {/* Section heading */}
        <hr />
        <div className="cards">
          {/* Mapping through the homes array to display each home */}
          {homes.map((home, index) => (
            <div className="card" key={index} onClick={() => togglePop(home)}>
              <div className="card__image">
                <img src={home.image} alt="Home" />{" "}
                {/* Displaying home image */}
              </div>
              <div className="card__info">
                <h4>{home.attributes[0].value} ETH</h4>{" "}
                {/* Displaying home price in ETH */}
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |{" "}
                  {/* Bedrooms */}
                  <strong>{home.attributes[3].value}</strong> ba |{" "}
                  {/* Bathrooms */}
                  <strong>{home.attributes[4].value}</strong> sqft{" "}
                  {/* Square footage */}
                </p>
                <p>{home.address}</p> {/* Displaying home address */}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Conditional rendering: Show Home component if toggle is true */}
      {toggle && (
        <Home
          home={home} // Passing selected home data
          provider={provider} // Passing blockchain provider
          account={account} // Passing connected account
          escrow={escrow} // Passing escrow contract instance
          togglePop={togglePop} // Passing function to toggle pop-up
        />
      )}
    </div>
  );
}

export default App; // Exporting the App component as the default export.
