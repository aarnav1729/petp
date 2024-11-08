import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ClosedRFQs = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClosedRFQs = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/closed-rfqs');
        setRfqs(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching closed RFQs:', error);
        setLoading(false);
      }
    };

    fetchClosedRFQs();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Closed RFQs for All Vendors</h2>
      {rfqs.length === 0 ? (
        <p className="text-center">No closed RFQs available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black">
            <thead className="bg-green-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-black">RFQ Number</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-black">Quotes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black">
              {rfqs.map((rfq) => (
                <tr key={rfq._id} className="hover:bg-blue-200">
                  <td className="px-6 py-4 text-sm text-black">{rfq.RFQNumber}</td>
                  <td className="px-6 py-4 text-sm text-black">
                    {rfq.quotes.map((quote, index) => (
                      <div key={index}>
                        <p>Vendor: {quote.vendorName}</p>
                        <p>Label: {quote.label}</p>
                        <p>Trucks Allotted: {quote.actualTrucksAllotted}</p>
                        <p>Price: {quote.price}</p>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClosedRFQs;