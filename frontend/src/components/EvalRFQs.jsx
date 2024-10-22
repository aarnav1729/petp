import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EvalRFQs = ({ userRole }) => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfqDetails, setRfqDetails] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [originalQuotes, setOriginalQuotes] = useState([]); // To store original quotes
  const [vendors, setVendors] = useState([]);
  const [rfqStatus, setRfqStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // State variables for vendor selections and modals
  const [reminderSelectedVendors, setReminderSelectedVendors] = useState([]);
  const [addVendorsSelectedVendors, setAddVendorsSelectedVendors] = useState(
    []
  );
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isAddVendorsModalOpen, setIsAddVendorsModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totalTrucksAllotted, setTotalTrucksAllotted] = useState(0);

  useEffect(() => {
    fetchRFQDetails();
    fetchQuotes();
    fetchVendors();
  }, [rfqId]);

  useEffect(() => {
    const total = quotes.reduce(
      (sum, quote) => sum + (quote.trucksAllotted || 0),
      0
    );
    setTotalTrucksAllotted(total);
  }, [quotes]);

  const fetchRFQDetails = async () => {
    try {
      const response = await axios.get(
        `https://petp.onrender.com/api/rfq/${rfqId}`
      );
      setRfqDetails(response.data);
      setRfqStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching RFQ details:", error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(
        `https://petp.onrender.com/api/quotes/${rfqId}`
      );
      setQuotes(response.data);
      // Store a deep copy of the original quotes
      setOriginalQuotes(JSON.parse(JSON.stringify(response.data)));
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get("https://petp.onrender.com/api/vendors");
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const assignQuoteLabels = (quotes, requiredTrucks) => {
    if (!requiredTrucks || requiredTrucks <= 0) return quotes;

    // Sort the quotes
    const sortedQuotes = [...quotes].sort((a, b) => {
      if (a.price !== b.price) {
        return a.price - b.price; // Ascending price
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt); // Earlier bids first
      }
    });

    let totalTrucks = 0;
    const result = [];
    let i = 0;
    let labelCounter = 1;

    while (i < sortedQuotes.length) {
      const currentPrice = sortedQuotes[i].price;
      const samePriceQuotes = [];

      // Collect all quotes with the same price
      while (
        i < sortedQuotes.length &&
        sortedQuotes[i].price === currentPrice
      ) {
        samePriceQuotes.push(sortedQuotes[i]);
        i++;
      }

      // Assign the same label to all vendors with the same price
      const label = `L${labelCounter}`;

      // Calculate total trucks offered by vendors at this price
      const totalOfferedTrucks = samePriceQuotes.reduce(
        (sum, q) => sum + q.numberOfTrucks,
        0
      );

      // Calculate remaining trucks to allocate
      const remainingTrucks = requiredTrucks - totalTrucks;

      // Maximum trucks that can be allocated in this group
      const maxAllocatableTrucks = Math.min(
        totalOfferedTrucks,
        remainingTrucks
      );

      // Allocate trucks proportionally based on trucks offered
      let groupTotalAllocated = 0;
      const allocation = samePriceQuotes.map((quote) => {
        const maxPossible = quote.numberOfTrucks;

        // Use edited trucksAllotted if available
        let trucksToAllot = quote.isEdited
          ? quote.trucksAllotted
          : Math.floor(
              (maxPossible / totalOfferedTrucks) * maxAllocatableTrucks
            );

        // Ensure we don't allocate more than offered
        trucksToAllot = Math.min(trucksToAllot, maxPossible);

        groupTotalAllocated += trucksToAllot;

        return {
          ...quote,
          label,
          trucksAllotted: trucksToAllot,
        };
      });

      // Update total trucks allocated
      totalTrucks += groupTotalAllocated;

      result.push(...allocation);

      labelCounter++;
    }

    // For any remaining vendors, set label to "-" and trucksAllotted to 0
    while (i < sortedQuotes.length) {
      const quote = sortedQuotes[i];
      result.push({
        ...quote,
        label: "-",
        trucksAllotted: 0,
      });
      i++;
    }

    return result;
  };

  const labeledQuotes = rfqDetails
    ? assignQuoteLabels(quotes, rfqDetails?.numberOfVehicles)
    : [];

  const handlePriceChange = (quoteId, value) => {
    setQuotes((prevQuotes) =>
      prevQuotes.map((quote) =>
        quote._id === quoteId ? { ...quote, price: parseFloat(value) } : quote
      )
    );
  };

  const handleTrucksAllottedChange = (quoteId, value) => {
    setQuotes((prevQuotes) =>
      prevQuotes.map((quote) => {
        if (quote._id === quoteId) {
          const newValue = parseInt(value, 10) || 0;
          return { ...quote, trucksAllotted: newValue, isEdited: true };
        }
        return quote;
      })
    );
  };

  const updateQuote = async (quote) => {
    try {
      const originalQuote = originalQuotes.find((q) => q._id === quote._id);

      const totalAllocated = quotes.reduce(
        (sum, q) =>
          sum + (q._id === quote._id ? quote.trucksAllotted : q.trucksAllotted),
        0
      );

      if (!originalQuote) {
        alert("Original quote not found.");
        return;
      }

      const isL1 = quote.label === "L1";

      let canUpdate = true;
      let errorMessage = "";

      if (totalAllocated !== rfqDetails.numberOfVehicles) {
        alert(
          `Total trucks allotted: (${totalAllocated}) does not match required number of vehicles: (${rfqDetails.numberOfVehicles}).`
        );
        return;
      }

      if (isL1) {
        const minL1Trucks = Math.ceil(rfqDetails.numberOfVehicles * 0.39);
  
        if (quote.price > originalQuote.price) {
          canUpdate = false;
          errorMessage = "L1 price cannot be increased.";
        }
  
        if (quote.trucksAllotted < minL1Trucks) {
          canUpdate = false;
          errorMessage = `L1 trucks allotted cannot be less than 39% of total trucks (${minL1Trucks}).`;
        }
      }
  
      if (!canUpdate) {
        alert(errorMessage);
        return;
      }  

      await axios.put(`https://petp.onrender.com/api/quote/factory/${quote._id}`, {
        price: quote.price,
        trucksAllotted: quote.trucksAllotted,
      });
      alert("Quote updated successfully.");
      await fetchQuotes();
    } catch (error) {
      console.error("Error updating quote:", error);
      alert(error.response?.data?.error || "Failed to update quote.");
    }
  };

  const sendParticipationReminder = async () => {
    setIsSending(true);
    setStatusMessage("");
    try {
      const response = await axios.post(
        "https://petp.onrender.com/api/send-reminder",
        {
          rfqId,
          vendorIds: reminderSelectedVendors,
        }
      );

      setStatusMessage(response.data.message || "Reminder sent successfully!");
    } catch (error) {
      setStatusMessage("Error sending participation reminder.");
    } finally {
      setIsSending(false);
      setIsReminderModalOpen(false);
    }
  };

  const addVendorsToRFQ = async () => {
    setIsSending(true);
    setStatusMessage("");
    try {
      const response = await axios.post(
        `https://petp.onrender.com/api/rfq/${rfqId}/add-vendors`,
        {
          vendorIds: addVendorsSelectedVendors,
        }
      );

      setStatusMessage(response.data.message || "Vendors added successfully!");

      // Re-fetch the RFQ details to update the selectedVendors list
      await fetchRFQDetails();
      // Reset the selected vendors for adding
      setAddVendorsSelectedVendors([]);
    } catch (error) {
      setStatusMessage("Error adding vendors to RFQ.");
    } finally {
      setIsSending(false);
      setIsAddVendorsModalOpen(false);
    }
  };

  const finalizeRFQ = async () => {
    setIsFinalizing(true);
    setStatusMessage("");
    try {
      const response = await axios.post(
        `https://petp.onrender.com/api/rfq/${rfqId}/finalize`
      );
      setStatusMessage("RFQ finalized successfully.");
      // Update the RFQ details and quotes to reflect the new status and labels
      await fetchRFQDetails();
      await fetchQuotes();
      // Close the modal
      setIsFinalizeModalOpen(false);
    } catch (error) {
      console.error("Error finalizing RFQ:", error);
      setStatusMessage("Error finalizing RFQ.");
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="container mx-auto px-3 py-7 bg-white rounded-lg shadow-lg">
      <button
        className="mb-4 text-white bg-indigo-600 hover:bg-indigo-800 font-bold rounded-full p-2"
        onClick={() => navigate(-1)}
      >
        &larr; Back
      </button>

      {rfqDetails ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">{rfqDetails.RFQNumber}</h2>

          <div className="mt-4">
            <p>
              Total Trucks Allotted: <strong>{totalTrucksAllotted}</strong> /{" "}
              {rfqDetails?.numberOfVehicles}
            </p>
          </div>

          {/* Vendor Quotes */}
          <div>
            <h3 className="font-bold mb-2">Vendor Quotes</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-black">
                <thead className="bg-green-600 rounded-lg">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Number of Trucks Offered
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Quote
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Trucks Allotted
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black">
                  {labeledQuotes.map((quote) => (
                    <tr key={quote._id} className="hover:bg-blue-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.numberOfTrucks}
                      </td>

                      {/* Price Input */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <input
                          type="number"
                          value={quote.price}
                          onChange={(e) =>
                            handlePriceChange(quote._id, e.target.value)
                          }
                          className="p-1 border"
                          disabled={rfqStatus === "closed"}
                        />
                      </td>

                      {/* Label */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.label}
                      </td>

                      {/* Trucks Allotted Input */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <input
                          type="number"
                          value={quote.trucksAllotted}
                          onChange={(e) =>
                            handleTrucksAllottedChange(
                              quote._id,
                              e.target.value
                            )
                          }
                          className="p-1 border"
                          disabled={rfqStatus === "closed"}
                        />
                      </td>

                      {/* Update Button */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {rfqStatus !== "closed" && (
                          <button
                            onClick={() => updateQuote(quote)}
                            className="bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Buttons for Actions */}
            <div className="mt-6 flex justify-center">
              <button
                className="text-white bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded-full mr-2"
                onClick={() => setIsReminderModalOpen(true)}
              >
                Send Participation Reminder
              </button>

              <button
                className="text-white bg-green-500 hover:bg-green-700 font-bold py-2 px-4 rounded-full"
                onClick={() => setIsAddVendorsModalOpen(true)}
              >
                Add Vendors to RFQ
              </button>

              <button
                className={`text-white bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded-full ml-2 ${
                  totalTrucksAllotted !== rfqDetails.numberOfVehicles
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => setIsFinalizeModalOpen(true)}
                disabled={totalTrucksAllotted !== rfqDetails.numberOfVehicles}
              >
                Finalize
              </button>
            </div>

            {/* Send Participation Reminder Modal */}
            {isReminderModalOpen && (
              <div className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-3/4">
                    <h2 className="text-xl font-bold mb-4">
                      Select Vendors for Reminder
                    </h2>
                    <ul className="mb-4">
                      {vendors.map((vendor) => (
                        <li key={vendor._id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={reminderSelectedVendors.includes(
                              vendor._id
                            )}
                            onChange={() =>
                              setReminderSelectedVendors((prevSelected) =>
                                prevSelected.includes(vendor._id)
                                  ? prevSelected.filter(
                                      (id) => id !== vendor._id
                                    )
                                  : [...prevSelected, vendor._id]
                              )
                            }
                            className="mr-2"
                          />
                          {vendor.vendorName}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-end">
                      <button
                        className="mr-4 bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
                        onClick={() => setIsReminderModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className={`bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg ${
                          isSending ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={sendParticipationReminder}
                        disabled={isSending}
                      >
                        {isSending ? "Sending..." : "Send Reminder"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Vendors to RFQ Modal */}
            {isAddVendorsModalOpen && (
              <div className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-3/4">
                    <h2 className="text-xl font-bold mb-4">
                      Select Vendors to Add
                    </h2>
                    <ul className="mb-4">
                      {vendors.map((vendor) => (
                        <li key={vendor._id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={addVendorsSelectedVendors.includes(
                              vendor._id
                            )}
                            onChange={() =>
                              setAddVendorsSelectedVendors((prevSelected) =>
                                prevSelected.includes(vendor._id)
                                  ? prevSelected.filter(
                                      (id) => id !== vendor._id
                                    )
                                  : [...prevSelected, vendor._id]
                              )
                            }
                            className="mr-2"
                          />
                          {vendor.vendorName}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-end">
                      <button
                        className="mr-4 bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
                        onClick={() => setIsAddVendorsModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className={`bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg ${
                          isSending ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={addVendorsToRFQ}
                        disabled={isSending}
                      >
                        {isSending ? "Adding..." : "Add Vendors"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finalize Modal */}
            {isFinalizeModalOpen && (
              <div className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-3/4">
                    <h2 className="text-xl font-bold mb-4">Finalize RFQ</h2>
                    <p>Truck Requirement: {rfqDetails.numberOfVehicles}</p>
                    <table className="min-w-full divide-y divide-black mt-4">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                            Vendor Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                            Label
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                            Trucks Allotted
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-black">
                        {labeledQuotes.map((quote) => (
                          <tr key={quote._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {quote.vendorName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {quote.label}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {quote.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {quote.trucksAllotted}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-4">
                      Are you sure you want to finalize this RFQ? This action
                      cannot be undone. Pressing this button will send an email
                      with the above allotment to the selected vendors!
                    </p>
                    <div className="flex justify-end mt-4">
                      <button
                        className="mr-4 bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
                        onClick={() => setIsFinalizeModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className={`bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded-lg ${
                          isFinalizing ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={finalizeRFQ}
                        disabled={isFinalizing}
                      >
                        {isFinalizing ? "Finalizing..." : "Finalize RFQ"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="mt-6 text-center">
              <p
                className={`text-lg ${
                  statusMessage.includes("Error")
                    ? "text-red-600 font-bold"
                    : "text-green-800 font-bold"
                }`}
              >
                {statusMessage}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-black">Loading RFQ details...</p>
      )}
    </div>
  );
};

export default EvalRFQs;

