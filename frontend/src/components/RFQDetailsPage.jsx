import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const RFQDetailsPage = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfqDetails, setRfqDetails] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false); // New state for handling loading
  const [statusMessage, setStatusMessage] = useState(""); // New state for displaying status

  useEffect(() => {
    const fetchRFQDetails = async () => {
      try {
        const response = await axios.get(`https://petp.onrender.com/api/rfq/${rfqId}`);
        setRfqDetails(response.data);
      } catch (error) {
        console.error("Error fetching RFQ details:", error);
      }
    };

    const fetchQuotes = async () => {
      try {
        const response = await axios.get(`https://petp.onrender.com/api/quotes/${rfqId}`);
        setQuotes(response.data);
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

    fetchRFQDetails();
    fetchQuotes();
    fetchVendors();
  }, [rfqId]);

  const handleVendorSelection = (vendorId) => {
    setSelectedVendors((prevSelected) =>
      prevSelected.includes(vendorId)
        ? prevSelected.filter((id) => id !== vendorId)
        : [...prevSelected, vendorId]
    );
  };

  const sendParticipationReminder = async () => {
    setIsSending(true); // Disable button and show loading indicator
    setStatusMessage(""); // Reset status message

    try {
      const response = await axios.post("https://petp.onrender.com/api/send-reminder", {
        rfqId,
        vendorIds: selectedVendors,
      });

      setStatusMessage(response.data.message || "Reminder sent successfully!");
    } catch (error) {
      setStatusMessage("Error sending participation reminder.");
    } finally {
      setIsSending(false); // Re-enable the button after completion
      setIsModalOpen(false); // Close the modal
    }
  };

  const assignQuoteLabels = (quotes, requiredTrucks) => {
    if (!requiredTrucks || requiredTrucks <= 0) return quotes; // Ensure `requiredTrucks` is valid
    const sortedQuotes = [...quotes].sort((a, b) => a.price - b.price); // Sort by price ascending
    let totalTrucks = 0;

    return sortedQuotes.map((quote, index) => {
      if (totalTrucks < requiredTrucks) {
        const trucksToAllot = Math.min(quote.numberOfTrucks, requiredTrucks - totalTrucks);
        totalTrucks += trucksToAllot;
        return { ...quote, label: `L${index + 1}`, trucksAllotted: trucksToAllot };
      }
      return { ...quote, label: "-", trucksAllotted: 0 };
    });
  };

  const labeledQuotes = rfqDetails ? assignQuoteLabels(quotes, rfqDetails?.numberOfVehicles) : [];

  return (
    <div className="container mx-auto px-3 py-7 bg-white rounded-lg shadow-lg">
      <button
        className="mb-4 text-white bg-indigo-600 hover:bg-indigo-800 font-bold rounded-full p-2"
        onClick={() => navigate(-1)}
      >
        &larr; Back
      </button>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <button
          className={`px-4 py-2 mx-2 rounded-lg ${activeTab === "details" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800 opacity-80"}`}
          onClick={() => setActiveTab("details")}
        >
          RFQ Details
        </button>
        <button
          className={`px-4 py-2 mx-2 rounded-lg ${activeTab === "quotes" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800 opacity-80"}`}
          onClick={() => setActiveTab("quotes")}
        >
          Vendor Quotes
        </button>
      </div>

      {/* RFQ Details */}
      {activeTab === "details" ? (
        rfqDetails ? (
          <div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(rfqDetails)
                .filter(([key]) => !["_id", "__v"].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="mt-1">
                    <dt className="inline font-medium">{key.split(/(?=[A-Z])/).join(" ")}:</dt>
                    <dd className="inline ml-2 text-black">{value ? value.toString() : "N/A"}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ) : (
          <p className="text-center text-black">Loading RFQ details...</p>
        )
      ) : null}

      {/* Vendor Quotes */}
      {activeTab === "quotes" && (
        <div>
          {rfqDetails && !rfqDetails.eReverseToggle && (
            <p className="text-center text-red-500 mb-4">eReverse auction is not enabled for this RFQ.</p>
          )}
          {quotes.length === 0 ? (
            <p className="text-center text-black">No quotes available for this RFQ.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-black">
                <thead className="bg-green-600 rounded-lg">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Vendor Name</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Number of Trucks</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Quote</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Label</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Trucks Allotted</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black">
                  {labeledQuotes.map((quote) => (
                    <tr key={quote._id} className="hover:bg-blue-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{quote.vendorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{quote.numberOfTrucks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{quote.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{quote.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{quote.trucksAllotted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Send Participation Reminder Button */}
          <div className="mt-6 flex justify-center">
            <button
              className="text-white bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded-full"
              onClick={() => setIsModalOpen(true)}
            >
              Send Participation Reminder
            </button>
          </div>

          {/* Modal for Vendor Selection */}
          {isModalOpen && (
            <div className="fixed z-50 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div className="bg-white p-6 rounded-lg shadow-lg w-3/4">
                  <h2 className="text-xl font-bold mb-4">Select Vendors</h2>
                  <ul className="mb-4">
                    {vendors.map((vendor) => (
                      <li key={vendor._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor._id)}
                          onChange={() => handleVendorSelection(vendor._id)}
                          className="mr-2"
                        />
                        {vendor.vendorName}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end">
                    <button
                      className="mr-4 bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className={`bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg ${isSending ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={sendParticipationReminder}
                      disabled={isSending} // Disable the button while sending
                    >
                      {isSending ? "Sending..." : "Send Reminder"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className="mt-6 text-center">
          <p className={`text-lg ${statusMessage.includes("Error") ? "text-red-600 font-bold" : "text-green-800 font-bold"}`}>
            {statusMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default RFQDetailsPage;