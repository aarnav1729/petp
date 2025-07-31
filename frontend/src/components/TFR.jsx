// src/components/TFR.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
const API = window.location.origin;
const TFR = () => {
  const [rfqData, setRfqData] = useState([]);
  const [trucksData, setTrucksData] = useState({}); // { quoteId: actualTrucksProvided }
  const [cumulativeTFR, setCumulativeTFR] = useState([]);

  // Fetch all RFQs with vendor data on component mount
  useEffect(() => {
    const fetchRFQData = async () => {
      try {
        // Fetch all closed RFQs
        const rfqResponse = await axios.get(
          `${API}/api/tfr/rfqs`
        );
        const rfqs = rfqResponse.data;

        // For each RFQ, fetch vendors and their quotes
        const rfqDataPromises = rfqs.map(async (rfq) => {
          const vendorsResponse = await axios.get(
            `${API}/api/tfr/rfqs/${rfq._id}/vendors`
          );
          return {
            ...rfq,
            vendors: vendorsResponse.data,
          };
        });

        const rfqDataWithVendors = await Promise.all(rfqDataPromises);

        // Initialize trucksData
        const initialTrucksData = {};
        rfqDataWithVendors.forEach((rfq) => {
          rfq.vendors.forEach((quote) => {
            initialTrucksData[quote._id] = quote.actualTrucksProvided || 0;
          });
        });

        setRfqData(rfqDataWithVendors);
        setTrucksData(initialTrucksData);
      } catch (error) {
        console.error("Error fetching RFQ data:", error);
      }
    };

    fetchRFQData();
  }, []);

  // Fetch cumulative TFR data
  useEffect(() => {
    const fetchCumulativeTFR = async () => {
      try {
        const response = await axios.get(
          `${API}/api/tfr/vendors/cumulative`
        );
        setCumulativeTFR(response.data);
      } catch (error) {
        console.error("Error fetching cumulative TFR:", error);
      }
    };

    fetchCumulativeTFR();
  }, [trucksData]); // Re-fetch when trucksData changes

  const handleActualTrucksChange = (quoteId, value) => {
    setTrucksData({
      ...trucksData,
      [quoteId]: Number(value),
    });
  };

  const handleSubmit = async () => {
    try {
      // Prepare trucksData for each RFQ
      const updatePromises = rfqData.map(async (rfq) => {
        const trucksDataArray = rfq.vendors.map((quote) => ({
          quoteId: quote._id,
          actualTrucksProvided: trucksData[quote._id] || 0,
        }));

        await axios.post(
          `${API}/api/tfr/rfqs/${rfq._id}/update-trucks`,
          { trucksData: trucksDataArray }
        );
      });

      await Promise.all(updatePromises);

      // Refresh cumulative TFR data
      const cumulativeResponse = await axios.get(
        "${API}/api/tfr/vendors/cumulative"
      );
      setCumulativeTFR(cumulativeResponse.data);

      alert("Actual trucks provided updated successfully");
    } catch (error) {
      console.error("Error updating actual trucks provided:", error);
      alert("Failed to update actual trucks provided");
    }
  };

  return (
    <div className="container mx-auto mt-8 p-4 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-6">Truck Fulfillment Ratio (TFR)</h1>

      {/* RFQs and Vendors Table */}
      <div className="mb-8">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border">RFQ Number</th>
              <th className="py-2 px-4 border">Vendor Name</th>
              <th className="py-2 px-4 border">Trucks Allotted</th>
              <th className="py-2 px-4 border">Actual Trucks Provided</th>
            </tr>
          </thead>
          <tbody>
            {rfqData.map((rfq) => (
              <React.Fragment key={rfq._id}>
                {rfq.vendors.length > 0 ? (
                  rfq.vendors.map((quote, index) => (
                    <tr key={quote._id}>
                      {index === 0 ? (
                        <td
                          className="py-2 px-4 border font-semibold"
                          rowSpan={rfq.vendors.length}
                        >
                          {rfq.RFQNumber}
                        </td>
                      ) : null}
                      <td className="py-2 px-4 border">{quote.vendorName}</td>
                      <td className="py-2 px-4 border">
                        {quote.trucksAllotted || 0}
                      </td>
                      <td className="py-2 px-4 border">
                        <input
                          type="number"
                          min="0"
                          max={quote.trucksAllotted || 0}
                          value={trucksData[quote._id] || 0}
                          onChange={(e) =>
                            handleActualTrucksChange(quote._id, e.target.value)
                          }
                          className="w-full p-2 border rounded"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2 px-4 border font-semibold">
                      {rfq.RFQNumber}
                    </td>
                    <td className="py-2 px-4 border" colSpan="3">
                      No vendors available for this RFQ
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleSubmit}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Update Actual Trucks Provided
        </button>
      </div>

      {/* Cumulative TFR */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Cumulative TFR</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Vendor Name</th>
              <th className="py-2 px-4 border">Total Trucks Allotted</th>
              <th className="py-2 px-4 border">Total Actual Trucks Provided</th>
              <th className="py-2 px-4 border">TFR (%)</th>
            </tr>
          </thead>
          <tbody>
            {cumulativeTFR.map((vendor) => (
              <tr key={vendor.vendorName}>
                <td className="py-2 px-4 border">{vendor.vendorName}</td>
                <td className="py-2 px-4 border">
                  {vendor.totalTrucksAllotted}
                </td>
                <td className="py-2 px-4 border">
                  {vendor.totalActualTrucksProvided}
                </td>
                <td className="py-2 px-4 border">{vendor.tfr.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TFR;
