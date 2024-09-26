import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RFQList = () => {
  const [rfqs, setRfqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    fetchRFQs(); // Initial fetch

    // Polling mechanism to fetch RFQs every minute
    const intervalId = setInterval(fetchRFQs, 60000); // 60000 ms = 1 minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchRFQs = async () => {
    try {
      const response = await axios.get('https://petp.onrender.com/api/rfqs');
      setRfqs(response.data);
    } catch (error) {
      console.error('Error fetching RFQs:', error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    console.log(`Updating RFQ with ID: ${id}, New Status: ${newStatus}`);
    try {
      await axios.patch(`https://petp.onrender.com/api/rfq/${id}`, { status: newStatus });

      // Find the RFQ in the current state and update its status directly
      setRfqs(prevRfqs =>
        prevRfqs.map(rfq =>
          rfq._id === id ? { ...rfq, status: newStatus } : rfq
        )
      );

    } catch (error) {
      console.error('Error updating status:', error);
    }
  };


  // function to format dates to only show the date part
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredRfqs = rfqs
  .filter((rfq) =>
    Object.values(rfq)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
  .filter((rfq) =>
    filterStatus
      ? (rfq.status || "open").toLowerCase() === filterStatus.toLowerCase()
      : true
  );

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">RFQ List</h2>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4 rounded-lg">
        <input
          type="text"
          placeholder="Search RFQs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="text-black p-3 border bg-gray-200 border-blue-900 rounded w-full md:w-1/3"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-black p-3 border bg-gray-200 border-blue-900 rounded w-full md:w-1/4"
        >
          <option value="">All Statuses</option>
          <option value="open">open</option>
          <option value="closed">closed</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded">
        <table className="w-full min-w-full divide-y divide-white rounded-full">
          <thead className="bg-green-600 rounded-lg">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Actions</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">RFQ Number</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Short Name</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Company Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">SAP Sale Order #</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Item Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Customer Name</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Origin Location</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Drop Location State</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Drop Location District</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Vehicle Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Additional Vehicle Details</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Number of Vehicles</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Weight (in tons)</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Budget Price/Vehicle</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Max Allowable Price/Vehicle</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">Begin Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">eReverse Date</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">eReverse Time</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">RFQ Closing Date</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">RFQ Closing Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black">
            {filteredRfqs.map((rfq) => (
              <tr key={rfq._id} onClick={() => navigate(`/rfq/${rfq._id}`)} className="cursor-pointer hover:bg-blue-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={rfq.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateStatus(rfq._id, e.target.value)}
                    className="mt-1 block w-full px-1 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="open">open</option>
                    <option value="closed">closed</option>
                  </select>

                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">{rfq.RFQNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.shortName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.companyType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.sapOrder}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.itemType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.originLocation}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.dropLocationState}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.dropLocationDistrict}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.vehicleType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.additionalVehicleDetails}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.numberOfVehicles}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.weight}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.budgetedPriceBySalesDept}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.maxAllowablePrice}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{formatDate(rfq.vehiclePlacementBeginDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{formatDate(rfq.vehiclePlacementEndDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{formatDate(rfq.eReverseDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.eReverseTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{formatDate(rfq.RFQClosingDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{rfq.RFQClosingTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RFQList;