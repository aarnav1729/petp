import React, { useState } from "react";
import axios from "axios";

const FastagTracking = () => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResponseData(null);

    if (!vehicleNumber.trim()) {
      setError("Please enter a valid vehicle number.");
      return;
    }

    try {
      // Corrected: remove the extra "+" before the object
      const res = await axios.post(
        "http://localhost:5000/api/fastag-tracking",
        {
          vehiclenumber: vehicleNumber,
        }
      );
      setResponseData(res.data);
    } catch (err) {
      console.error("Error:", err);
      if (err.response) {
        const status = err.response.status;
        let msg = err.response.data?.message || err.response.statusText;
        msg = msg || "Unknown server error.";
        setError(`Error [${status}]: ${msg}`);
      } else if (err.request) {
        setError("No response from the server. Please try again later.");
      
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    }
  };

  // Helper to parse data
  const getTollPlazaData = () => {
    if (
      !responseData ||
      !responseData.data ||
      !Array.isArray(responseData.data.response) ||
      responseData.data.response.length === 0 ||
      !responseData.data.response[0].response?.vehicle?.vehltxnList?.txn
    ) {
      return [];
    }
    return responseData.data.response[0].response.vehicle.vehltxnList.txn;
  };

  const tollPlazaData = getTollPlazaData();

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">FASTag Tracking</h2>

      {/* Vehicle Number Input + Submit */}
      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block mb-2 text-sm font-medium text-black">
          Enter Vehicle Number
        </label>
        <input
          type="text"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          className="w-full p-3 mb-4 border bg-gray-200 border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. HR55AL1020"
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-900 text-white rounded-lg font-semibold transition duration-200"
        >
          Track Vehicle
        </button>
      </form>

      {/* Error Display */}
      {error && <p className="text-red-500 text-center my-4">{error}</p>}

      {/* Results Table */}
      {tollPlazaData.length > 0 && (
        <div className="overflow-x-auto rounded">
          <table className="w-full min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-green-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                  Reader Read Time
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                  Toll Plaza Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                  Lane Direction
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                  Geocode
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                  Vehicle Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {tollPlazaData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-100 transition-colors duration-200"
                >
                  <td className="px-6 py-4 text-sm text-black">
                    {item.readerReadTime || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {item.tollPlazaName || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {item.laneDirection || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {item.tollPlazaGeocode || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {item.vehicleType || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* If API call succeeds but no records */}
      {responseData && tollPlazaData.length === 0 && !error && (
        <p className="text-center text-gray-700 mt-6">
          No toll-plaza tracking records found for the given vehicle number.
        </p>
      )}
    </div>
  );
};

export default FastagTracking;