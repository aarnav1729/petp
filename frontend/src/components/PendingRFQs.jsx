import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API = "https://14.194.111.58:10443";
const PendingRFQs = ({ username }) => {
  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingRFQs = async () => {
      try {
        console.log('Fetching pending RFQs for username:', username);
        const response = await axios.get(
          `${API}/api/vendor-pending-rfqs/${username}`
        );
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

  // Function to format dates to only show the date part
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Your RFQs</h2>
      <div className="overflow-x-auto rounded bg-white">
        <table className="min-w-full divide-y divide-black rounded">
          <thead className="bg-green-600 rounded-full">
            <tr>
              {/* Existing Columns */}
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                RFQ Number
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Assigned Label
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Trucks Allotted
              </th>
              {/* New Columns */}
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Origin Location
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Drop Location State
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Drop Location District
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Vehicle Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Additional Vehicle Details
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Vehicle Placement Begin Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Vehicle Placement End Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black">
            {pendingRFQs.map((rfq) => (
              <tr
                key={rfq._id}
                className="cursor-pointer hover:bg-blue-200"
                onClick={() => navigate(`/vendor/rfq/${rfq._id}/lr-numbers`)} // Add this line
              >
                {/* Existing Data */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.RFQNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.trucksAllotted}
                </td>
                {/* New Data */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.originLocation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.dropLocationState}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.dropLocationDistrict}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.vehicleType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {rfq.additionalVehicleDetails}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {formatDate(rfq.vehiclePlacementBeginDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {formatDate(rfq.vehiclePlacementEndDate)}
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