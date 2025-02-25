import { useEffect, useState } from "react";
import close from "../assets/close.svg";

// Steps to buy
// 1. hardhat #0 is the buyer
// 2. hardHat #2 is the Inspector
// 3. hardHat #3 is the Lender
// 4. hardHat #1 is the Seller

const Home = ({ home, provider, account, escrow, togglePop }) => {
  // State variables for tracking transaction approvals
  const [hasBought, setHasBought] = useState(false);
  const [hasLended, setHasLended] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasSold, setHasSold] = useState(false);

  // State variables for tracking roles and ownership
  const [buyer, setBuyer] = useState(null);
  const [lender, setLender] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [seller, setSeller] = useState(null);
  const [owner, setOwner] = useState(null);

  // Fetching contract details related to the home
  const fetchDetails = async () => {
    try {
      // Fetching the buyer address for the given home ID
      setBuyer(await escrow.buyer(home.id));

      // Fetching the seller address from the escrow contract
      setSeller(await escrow.seller());

      // Fetching the lender address from the escrow contract
      setLender(await escrow.lender());

      // Fetching the inspector address from the escrow contract
      setInspector(await escrow.inspector());

      // Checking if the buyer has approved the purchase
      setHasBought(await escrow.approval(home.id, buyer));

      // Checking if the seller has approved the sale
      setHasSold(await escrow.approval(home.id, seller));

      // Checking if the lender has approved the loan
      setHasLended(await escrow.approval(home.id, lender));

      // Checking if the inspection has been passed
      setHasInspected(await escrow.inspectionPassed(home.id));
    } catch (error) {
      console.error("Error fetching home details:", error); // Logging error if fetching fails
    }
  };

  // Check ownership status
  const fetchOwner = async () => {
    try {
      // If the home is not listed, fetch the buyer who is now the owner
      if (!(await escrow.isListed(home.id))) {
        setOwner(await escrow.buyer(home.id));
      }
    } catch (error) {
      console.error("Error fetching owner:", error); // Logging error if fetching fails
    }
  };

  // Function to handle buying a home
  const buyHandler = async () => {
    try {
      // Fetching the escrow amount required for the purchase
      const escrowAmount = await escrow.escrowAmount(home.id);

      // Getting the connected wallet signer
      const signer = await provider.getSigner();

      // Depositing the required escrow amount into the contract
      let transaction = await escrow
        .connect(signer)
        .depositEarnest(home.id, { value: escrowAmount });
      await transaction.wait(); // Waiting for the transaction to be confirmed

      // Approving the sale after depositing escrow
      transaction = await escrow.connect(signer).approveSale(home.id);
      await transaction.wait(); // Waiting for the transaction to be confirmed

      setHasBought(true); // Updating the state to reflect the buyer's approval
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction rejected or failed."); // Alerting user in case of failure
    }
  };

  // Function to handle inspection approval
  const inspectHandler = async () => {
    try {
      // Getting the connected wallet signer
      const signer = await provider.getSigner();

      // Updating the inspection status to 'passed'
      const transaction = await escrow
        .connect(signer)
        .updateInspectionStatus(home.id, true);
      await transaction.wait(); // Waiting for the transaction to be confirmed

      setHasInspected(true); // Updating the state to reflect inspection approval
    } catch (error) {
      console.error("Inspection approval failed:", error);
      alert("Inspection approval rejected."); // Alerting user in case of failure
    }
  };

  // Function to handle lending approval
  const lendHandler = async () => {
    try {
      if (account !== lender) {
        alert("You are not authorized to approve this loan.");
        return;
      }

      const signer = await provider.getSigner();

      await escrow
        .connect(signer)
        .approveSale(home.id)
        .then((tx) => tx.wait());

      const lendAmount =
        (await escrow.purchasePrice(home.id)) -
        (await escrow.escrowAmount(home.id));

      await signer.sendTransaction({
        to: escrow.target,
        value: lendAmount.toString(),
        gasLimit: 60000,
      });

      setHasLended(true);
    } catch (error) {
      console.error("Lending transaction failed:", error);
      alert("Lending approval rejected.");
    }
  };

  // Function to handle selling approval and finalization
  const sellHandler = async () => {
    try {
      // Getting the connected wallet signer
      const signer = await provider.getSigner();

      // Approving the sale as a seller
      await escrow
        .connect(signer)
        .approveSale(home.id)
        .then((tx) => tx.wait()); // Waiting for the transaction to be confirmed

      // Finalizing the sale, transferring ownership
      await escrow
        .connect(signer)
        .finalizeSale(home.id)
        .then((tx) => tx.wait()); // Waiting for the transaction to be confirmed

      setHasSold(true); // Updating the state to reflect sale completion
    } catch (error) {
      console.error("Selling transaction failed:", error);
      alert("Sale approval or finalization rejected."); // Alerting user in case of failure
    }
  };

  // useEffect runs when the component mounts and whenever `hasSold` changes
  useEffect(() => {
    fetchDetails(); // Fetching home details
    fetchOwner(); // Fetching ownership status
  }, [hasSold]); // Dependencies array ensures it re-runs when `hasSold` changes

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__image">
          <img src={home.image} alt="Home" />
        </div>
        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |{" "}
            <strong>{home.attributes[3].value}</strong> ba |
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>
          <h2>{home.attributes[0].value} ETH</h2>

          {owner ? (
            <div className="home__owned">
              Owned by {owner.slice(0, 6) + "..." + owner.slice(38, 42)}
            </div>
          ) : (
            <div>
              {account === inspector ? (
                <button
                  className="home__buy"
                  onClick={inspectHandler}
                  disabled={hasInspected}
                >
                  Approve Inspection
                </button>
              ) : account === lender ? (
                <button
                  className="home__buy"
                  onClick={lendHandler}
                  disabled={hasLended}
                >
                  Approve & Lend
                </button>
              ) : account === seller ? (
                <button
                  className="home__buy"
                  onClick={sellHandler}
                  disabled={hasSold}
                >
                  Approve & Sell
                </button>
              ) : (
                <button
                  className="home__buy"
                  onClick={buyHandler}
                  disabled={hasBought}
                >
                  Buy
                </button>
              )}
              <button className="home__contact">Contact agent</button>
            </div>
          )}

          <hr />
          <h2>Overview</h2>
          <p>{home.description}</p>
          <hr />
          <h2>Facts and features</h2>
          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong> : {attribute.value}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={togglePop} className="home__close">
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Home;
