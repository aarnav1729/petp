import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ActiveAuctions = () => {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    const fetchActiveAuctions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/active-auctions');
        setAuctions(response.data);
      } catch (error) {
        console.error('Error fetching active auctions:', error);
      }
    };
    fetchActiveAuctions();
  }, []);

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Active Auctions</h2>
      <div className="overflow-x-auto rounded bg-white">
        <table className="min-w-full divide-y divide-black rounded">
          <thead className="bg-green-600 rounded-full">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                RFQ Number
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                Short Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                Auction End Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black">
            {auctions.map((auction) => (
              <tr key={auction._id} className="cursor-pointer hover:bg-blue-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  <Link to={`/auction-room/${auction._id}`} className="text-indigo-600 hover:underline hover:text-indigo-900">
                    Enter Auction Room
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {auction.RFQNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {auction.shortName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {new Date(auction.eReverseDate).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {auction.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveAuctions;