import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EvalRFQs = ({ userRole }) => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfqDetails, setRfqDetails] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [rfqStatus, setRfqStatus] = useState("");
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // State variables for vendor selections and modals
  const [reminderSelectedVendors, setReminderSelectedVendors] = useState([]);
  const [addVendorsSelectedVendors, setAddVendorsSelectedVendors] = useState(
    []
  );
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isAddVendorsModalOpen, setIsAddVendorsModalOpen] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [isInitialQuotePeriodOver, setIsInitialQuotePeriodOver] =
    useState(false);

  useEffect(() => {
    fetchRFQDetails();

    const fetchQuotes = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/quotes/${rfqId}`
        );
        setQuotes(response.data);
      } catch (error) {
        console.error("Error fetching quotes:", error);
      }
    };

    const fetchVendors = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/vendors");
        setVendors(response.data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };

    fetchQuotes();
    fetchVendors();
  }, [rfqId]);

  const finalizeRFQ = async () => {
    setIsFinalizing(true);
    setStatusMessage("");
    try {
      const response = await axios.post(
        `http://localhost:5000/api/rfq/${rfqId}/finalize`
      );
      setStatusMessage("RFQ finalized successfully.");
      // Update the RFQ details to reflect the new status
      await fetchRFQDetails();
      // Close the modal
      setIsFinalizeModalOpen(false);
    } catch (error) {
      console.error("Error finalizing RFQ:", error);
      setStatusMessage("Error finalizing RFQ.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const fetchRFQDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/rfq/${rfqId}`
      );
      setRfqDetails(response.data);
      setRfqStatus(response.data.status);

      // Check if initial quote period is over
      const initialQuoteEndTime = new Date(response.data.initialQuoteEndTime);
      const now = new Date();
      setIsInitialQuotePeriodOver(now > initialQuoteEndTime);

      // Initialize the reminder selected vendors with those already selected in the RFQ
      if (response.data.selectedVendors) {
        setReminderSelectedVendors(
          response.data.selectedVendors.map((vendor) => vendor._id)
        );
      }
    } catch (error) {
      console.error("Error fetching RFQ details:", error);
    }
  };

  const reminderVendors = vendors.filter(
    (vendor) =>
      rfqDetails &&
      rfqDetails.selectedVendors &&
      rfqDetails.selectedVendors.some(
        (selectedVendor) => selectedVendor._id === vendor._id
      )
  );

  const addVendorsList = vendors.filter(
    (vendor) =>
      !rfqDetails ||
      !rfqDetails.selectedVendors ||
      !rfqDetails.selectedVendors.some(
        (selectedVendor) => selectedVendor._id === vendor._id
      )
  );

  const handleReminderVendorSelection = (vendorId) => {
    setReminderSelectedVendors((prevSelected) =>
      prevSelected.includes(vendorId)
        ? prevSelected.filter((id) => id !== vendorId)
        : [...prevSelected, vendorId]
    );
  };

  const handleAddVendorsSelection = (vendorId) => {
    setAddVendorsSelectedVendors((prevSelected) =>
      prevSelected.includes(vendorId)
        ? prevSelected.filter((id) => id !== vendorId)
        : [...prevSelected, vendorId]
    );
  };

  const sendParticipationReminder = async () => {
    setIsSending(true);
    setStatusMessage("");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/send-reminder",
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
        `http://localhost:5000/api/rfq/${rfqId}/add-vendors`,
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

  // Remove the assignQuoteLabels function call
  // const labeledQuotes = rfqDetails
  //   ? assignQuoteLabels(quotes, rfqDetails?.numberOfVehicles)
  //   : [];

  // Use quotes directly and sort them if necessary
  const labeledQuotes = [...quotes].sort((a, b) => a.price - b.price);

  const handlePriceChange = (quoteId, value) => {
    setQuotes((prevQuotes) =>
      prevQuotes.map((quote) =>
        quote._id === quoteId ? { ...quote, price: parseFloat(value) } : quote
      )
    );
  };

  const handleTrucksAllottedChange = (quoteId, value) => {
    setQuotes((prevQuotes) =>
      prevQuotes.map((quote) =>
        quote._id === quoteId
          ? { ...quote, trucksAllotted: parseInt(value, 10) }
          : quote
      )
    );
  };

  const updateQuote = async (quote) => {
    try {
      console.log("Updating quote:", quote);
      await axios.put(`http://localhost:5000/api/quote/factory/${quote._id}`, {
        price: quote.price,
        trucksAllotted: quote.trucksAllotted,
        label: quote.label,
      });
      alert("Quote updated successfully.");
    } catch (error) {
      console.error("Error updating quote:", error);
      alert("Failed to update quote.");
    }
  };

  // Remove the assignQuoteLabels function call
  // const labeledQuotes = rfqDetails
  //   ? assignQuoteLabels(quotes, rfqDetails?.numberOfVehicles)
  //   : [];

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

                    {isInitialQuotePeriodOver && (
                      <>
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
                      </>
                    )}
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
                      {isInitialQuotePeriodOver && (
                        <>
                          {/* Price Input */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {quote.label === "L1" ? (
                              <span>{quote.price}</span>
                            ) : (
                              <input
                                type="number"
                                value={quote.price}
                                onChange={(e) =>
                                  handlePriceChange(quote._id, e.target.value)
                                }
                                className="p-1 border"
                                disabled={rfqStatus === "closed"}
                              />
                            )}
                          </td>

                          {/* Label */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {quote.label}
                          </td>

                          {/* Trucks Allotted Input */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {quote.label === "L1" ? (
                              <span>{quote.trucksAllotted}</span>
                            ) : (
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
                            )}
                          </td>

                          {/* Update Button */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {quote.label !== "L1" && rfqStatus !== "closed" && (
                              <button
                                onClick={() => updateQuote(quote._id)}
                                className="bg-blue-500 text-white px-2 py-1 rounded"
                              >
                                Update
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isInitialQuotePeriodOver && (
              <div className="mt-4 text-center">
                <p className="text-red-600 font-bold">
                  Labels, quotes, and trucks allotted will be available after
                  the initial quote period ends.
                </p>
              </div>
            )}

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
                className="text-white bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded-full ml-2"
                onClick={() => setIsFinalizeModalOpen(true)}
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
                      {reminderVendors.map((vendor) => (
                        <li key={vendor._id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={reminderSelectedVendors.includes(
                              vendor._id
                            )}
                            onChange={() =>
                              handleReminderVendorSelection(vendor._id)
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
                      {addVendorsList.map((vendor) => (
                        <li key={vendor._id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={addVendorsSelectedVendors.includes(
                              vendor._id
                            )}
                            onChange={() =>
                              handleAddVendorsSelection(vendor._id)
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
                      cannot be undone.
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