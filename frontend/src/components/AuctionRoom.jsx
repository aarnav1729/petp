import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment-timezone";
import axios from "axios";

const AuctionRoom = ({ username, role }) => {
  const { rfqId } = useParams();
  const vendorName = username;
  const [bids, setBids] = useState([]);
  const [newBid, setNewBid] = useState({ price: '', numberOfTrucks: '' });
  const [timeRemaining, setTimeRemaining] = useState("");
  const [rfqNumber, setRfqNumber] = useState("");
  const [numberOfVehicles, setNumberOfVehicles] = useState(0);
  const [vendorQuotes, setVendorQuotes] = useState({});

  useEffect(() => {
    const fetchRFQDetails = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/rfq/${rfqId}`);
        const rfq = response.data;

        setRfqNumber(rfq.RFQNumber);
        setNumberOfVehicles(rfq.numberOfVehicles);

        if (role === "vendor") {
          // Prepopulate bid inputs with the current vendor's existing bid if it exists
          const bidResponse = await axios.get(`http://127.0.0.1:5000/api/quotes/${rfqId}`);
          const existingBid = bidResponse.data.find(quote => quote.vendorName === vendorName);

          if (existingBid) {
            setNewBid({ price: existingBid.price.toString(), numberOfTrucks: existingBid.numberOfTrucks.toString() });
          }
        }

        const eReverseDateTime = moment.tz(
          `${moment(rfq.eReverseDate).format('YYYY-MM-DD')} ${rfq.eReverseTime}`,
          "Asia/Kolkata"
        );

        const endTime = eReverseDateTime.clone().add(2, "hours");
        const startTime = eReverseDateTime.clone().subtract(2, "hours");

        const interval = setInterval(() => {
          const now = moment();
          const timeLeft = endTime.diff(now);

          if (timeLeft <= 0) {
            clearInterval(interval);
            setTimeRemaining("Auction Ended");
          } else if (now.isBefore(startTime)) {
            setTimeRemaining(`Auction starts in: ${startTime.diff(now, "minutes")} minutes`);
          } else {
            setTimeRemaining(`Auction ends in: ${moment.duration(timeLeft).humanize()}`);
          }
        }, 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error fetching RFQ details:", error);
      }
    };

    fetchRFQDetails();
  }, [rfqId, role]);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/quotes/${rfqId}`);
        if (role === "vendor") {
          setVendorQuotes(response.data.reduce((acc, quote) => {
            if (quote.vendorName === vendorName) {
              acc[quote.rfqId] = quote;
            }
            return acc;
          }, {}));
        }
        const labeledQuotes = assignQuoteLabels(response.data, numberOfVehicles);
        setBids(labeledQuotes);
      } catch (error) {
        console.error("Error fetching bids:", error);
      }
    };

    fetchBids();
    const interval = setInterval(fetchBids, 5000);

    return () => clearInterval(interval);
  }, [rfqId, numberOfVehicles, role]);

  const assignQuoteLabels = (quotes, requiredTrucks) => {
    const sortedQuotes = [...quotes].sort((a, b) => {
      if (a.price !== b.price) {
        return a.price - b.price; // Sort by price (ascending)
      } else {
        return b.numberOfTrucks - a.numberOfTrucks; // Sort by number of trucks (descending)
      }
    });

    let totalTrucks = 0;
    let lastLabel = null;

    return sortedQuotes.map((quote, index) => {
      if (totalTrucks < requiredTrucks) {
        const trucksToAllot = Math.min(quote.numberOfTrucks, requiredTrucks - totalTrucks);
        totalTrucks += trucksToAllot;

        // Assign the same label if the price and number of trucks are the same as the previous quote
        if (index > 0 && sortedQuotes[index - 1].price === quote.price && sortedQuotes[index - 1].numberOfTrucks === quote.numberOfTrucks) {
          return { ...quote, label: lastLabel, trucksAllotted: trucksToAllot };
        } else {
          lastLabel = `L${index + 1}`;
          return { ...quote, label: lastLabel, trucksAllotted: trucksToAllot };
        }
      }
      return { ...quote, label: "-", trucksAllotted: 0 };
    });
  };

  const handlePlaceBid = async () => {
    const price = parseFloat(newBid.price);
    const numberOfTrucks = parseInt(newBid.numberOfTrucks, 10);

    if (!isNaN(price) && !isNaN(numberOfTrucks)) {
      try {
        // Fetch the current RFQ details to get the eReverse end time
        const rfqResponse = await axios.get(`http://127.0.0.1:5000/api/rfq/${rfqId}`);
        const rfq = rfqResponse.data;
        const eReverseDateTime = moment.tz(
          `${moment(rfq.eReverseDate).format('YYYY-MM-DD')} ${rfq.eReverseTime}`,
          "Asia/Kolkata"
        );
        const endTime = eReverseDateTime.clone().add(2, "hours");
        const now = moment();

        // Check if the auction has ended
        if (now.isAfter(endTime)) {
          alert("The auction has ended. You can no longer place bids.");
          return; // Prevent bid from being placed
        }

        const currentBid = vendorQuotes[rfqId] ? vendorQuotes[rfqId].price : null;
        const currentTrucks = vendorQuotes[rfqId] ? vendorQuotes[rfqId].numberOfTrucks : null;

        // Check if the new bid meets the criteria for updating
        const priceReductionCondition = price <= currentBid - 500;
        const truckChangeCondition = price <= currentBid && numberOfTrucks !== currentTrucks;

        if (currentBid !== null && !priceReductionCondition && !truckChangeCondition) {
          alert("Your bid should be at least 500 lower than your current bid or you should change the number of trucks.");
          return;
        }

        // Proceed with bid submission
        if (vendorQuotes[rfqId]) {
          // Update existing bid
          await axios.put(
            `http://127.0.0.1:5000/api/quote/${vendorQuotes[rfqId]._id}`,
            {
              rfqId,
              vendorName,
              quote: price,
              numberOfTrucks,
              message: 'Updated bid'
            }
          );
        } else {
          // Create a new bid
          await axios.post("http://127.0.0.1:5000/api/quote", {
            rfqId,
            vendorName,
            quote: price,
            numberOfTrucks,
            message: 'Initial bid'
          });
        }

        // Fetch updated bids
        const response = await axios.get(`http://127.0.0.1:5000/api/quotes/${rfqId}`);
        const labeledQuotes = assignQuoteLabels(response.data, numberOfVehicles);
        setBids(labeledQuotes);

        // Update the new bid inputs with the latest values
        setNewBid({ price: price.toString(), numberOfTrucks: numberOfTrucks.toString() });
      } catch (error) {
        console.error("Error placing bid:", error);
      }
    }
  };

  return (
    <div className="container mx-auto mt-8">
      <h2 className="text-3xl font-bold text-center mb-6">Auction Room for {rfqNumber}</h2>
      <div className="mb-6 text-center">
        <h3 className="font-bold text-black text-2xl">{timeRemaining}</h3>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mt-3 border-b border-black text-center bg-white rounded p-2">Current Bids</h3>
        <table className="min-w-full divide-y divide-black">
          <thead className="bg-green-500 rounded-full text-black font-bold">
            <tr>
              {role === "admin" && (
                <th className="px-6 py-3 text-left text-black font-bold text-xs uppercase tracking-wider">
                  Vendor Name
                </th>
              )}
              <th className="px-6 py-3 text-left text-black font-bold text-xs uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-black font-bold text-xs uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-black font-bold text-xs uppercase tracking-wider">
                Number of Trucks
              </th>
              <th className="px-6 py-3 text-left text-black font-bold text-xs uppercase tracking-wider">
                Trucks Allotted
              </th>
            </tr>
          </thead>
          <tbody className="bg-white border-b border-black divide-y text-black divide-black">
            {bids.map((bid, index) => (
              <tr
                key={index}
                className={`${
                  bid.vendorName === vendorName ? "bg-yellow-200 font-bold" : ""
                }`}
              >
                {role === "admin" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">{bid.vendorName}</td>
                )}
                <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-black">{bid.label}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-black">{bid.price}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-black">{bid.numberOfTrucks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">{bid.trucksAllotted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {role === "vendor" && (
        <div className="mb-4">
          <input
            type="number"
            value={newBid.price}
            onChange={(e) => setNewBid({ ...newBid, price: e.target.value })}
            className="border rounded p-2 border-black"
            placeholder="Enter your bid"
          />
          <input
            type="number"
            value={newBid.numberOfTrucks}
            onChange={(e) => setNewBid({ ...newBid, numberOfTrucks: e.target.value })}
            className="border rounded p-2 ml-2 border-black"
            placeholder="Number of trucks"
          />
          <button
            onClick={handlePlaceBid}
            className="bg-blue-500 border-b order-b-2 border-t border-l border-r border-black text-white px-4 py-2 rounded ml-2"
          >
            Place Bid
          </button>
        </div>
      )}
    </div>
  );
};

export default AuctionRoom;