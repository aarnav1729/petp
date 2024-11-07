// import required modules
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// create and export vendor rfq list component
const VendorRFQList = ({ username }) => {
  const [rfqs, setRfqs] = useState([]);
  const [vendorQuotes, setVendorQuotes] = useState({});
  const navigate = useNavigate();

  // fetch rfqs and vendor quotes from backend
  const fetchVendorQuotes = async () => {
    
    try {
      const response = await axios.get("http://3.108.87.99:5000/api/quotes");
      // filter quotes by vendor name
      const quotesByVendor = response.data.reduce((acc, quote) => {
        // set vendor quotes
        if (quote.vendorName === username) {
          acc[quote.rfqId] = quote;
        }
        return acc;
      }, {});
      setVendorQuotes(quotesByVendor);
    } catch (error) {
      console.error("Error fetching vendor quotes:", error);
    }
  };

  // fetch RFQs the vendor was invited to and their respective quotes
  const fetchRFQs = async () => {
    try {
      const response = await axios.get(
        `http://3.108.87.99:5000/api/rfqs/vendor/${username}`
      );
      setRfqs(response.data);
    } catch (error) {
      console.error("Error fetching RFQs for vendor:", error);
    }
  };

  // useEffect to fetch RFQs and vendor quotes
  useEffect(() => {
    fetchRFQs();
    fetchVendorQuotes();
  }, [username]);

  // function to format dates to only show the date part
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        RFQ List for Vendors
      </h2>

      {rfqs.length === 0 ? (
        <p className="text-center text-black">
          You have no RFQs at the moment.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white rounded-full">
            <thead className="bg-green-600 rounded-full">
              <tr>
                {[
                  "Actions",
                  "RFQ Number",
                  "Short Name",
                  "Company Type",
                  "Item Type",
                  "Origin Location",
                  "Drop Location State",
                  "Drop Location District",
                  "Vehicle Type",
                  "Additional Vehicle Details",
                  "Number of Vehicles",
                  "Weight",
                  "Vehicle Placement Begin Date",
                  "Vehicle Placement End Date",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black">
              {rfqs.map((rfq) => (
                <tr key={rfq._id} className="cursor-pointer hover:bg-blue-200">
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {rfq.status !== "closed" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/vendor-quote-form/${rfq._id}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {vendorQuotes[rfq._id]
                          ? "Update Quote"
                          : "View & Quote"}
                      </button>
                    ) : (
                      <span className="text-gray-500">Closed</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {rfq.RFQNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {rfq.shortName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {rfq.companyType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {rfq.itemType}
                  </td>
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
                    {rfq.numberOfVehicles}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {rfq.weight}
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
      )}
    </div>
  );
};

export default VendorRFQList;