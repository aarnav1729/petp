import React, { useEffect, useState } from "react";
import axios from "axios";

const PendingRFQs = ({ username }) => {
  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptedRFQs, setAcceptedRFQs] = useState([]); 

  useEffect(() => {
    const fetchPendingRFQs = async () => {
      try {
        const response = await axios.get(`https://petp.onrender.com/api/vendor-pending-rfqs/${username}`);
        setPendingRFQs(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching pending RFQs:", error);
        setError("Failed to fetch pending RFQs. Please try again later.");
        setLoading(false);
      }
    };

    fetchPendingRFQs();
  }, [username]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (pendingRFQs.length === 0) {
    return <div>No pending RFQs available.</div>;
  }

  const handleAccept = async (rfqId) => {
    try {
      const response = await axios.post(`https://petp.onrender.com/api/accept-rfq`, { rfqId, vendorName: username });
      if (response.data.success) {
        alert("RFQ accepted successfully. Confirmation emails sent.");
        setAcceptedRFQs((prev) => [...prev, rfqId]);

        // Move the accepted RFQ to the bottom of the list
        setPendingRFQs((prevRFQs) => {
          const acceptedRfq = prevRFQs.find((rfq) => rfq._id === rfqId);
          const remainingRFQs = prevRFQs.filter((rfq) => rfq._id !== rfqId);
          return [...remainingRFQs, acceptedRfq]; // Append accepted RFQ to the end
        });
      }
    } catch (error) {
      console.error("Error accepting RFQ:", error);
      alert("An error occurred while accepting the RFQ. Please try again.");
    }
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Pending RFQs</h2>
      <div className="overflow-x-auto rounded bg-white">
        <table className="min-w-full divide-y divide-black rounded">
          <thead className="bg-green-600 rounded-full">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                RFQ Number
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                Assigned Label
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                Trucks Allotted
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black">
            {pendingRFQs.map((rfq) => (
              <tr key={rfq._id} className="cursor-pointer hover:bg-blue-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.RFQNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.trucksAllotted}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {acceptedRFQs.includes(rfq._id) ? (
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded cursor-not-allowed"
                      disabled
                    >
                      Accepted
                    </button>
                  ) : (
                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded"
                      onClick={() => handleAccept(rfq._id)}
                    >
                      Accept
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingRFQs;