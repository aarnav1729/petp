import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
const API = "https://14.194.111.58:10443";
const EvalRFQs = ({ userRole }) => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfqDetails, setRfqDetails] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [rfqStatus, setRfqStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [leafAllocation, setLeafAllocation] = useState([]);
  const [logisticsAllocation, setLogisticsAllocation] = useState([]);
  const [totalLeafPrice, setTotalLeafPrice] = useState(0);
  const [totalLogisticsPrice, setTotalLogisticsPrice] = useState(0);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [finalizeReason, setFinalizeReason] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [evaluationPeriodEnded, setEvaluationPeriodEnded] = useState(false);
  const [enrichedQuotes, setEnrichedQuotes] = useState([]);

  useEffect(() => {
    fetchRFQDetails();
    fetchQuotes();
    fetchVendors();
  }, [rfqId]);

  useEffect(() => {
    if (rfqDetails) {
      const currentTime = new Date();
      const evaluationEndTime = new Date(rfqDetails.evaluationEndTime);
      setEvaluationPeriodEnded(currentTime >= evaluationEndTime);
    }
  }, [rfqDetails]);

  useEffect(() => {
    if (rfqDetails && enrichedQuotes.length > 0) {
      const leafAlloc = assignLeafAllocation(
        enrichedQuotes,
        rfqDetails.numberOfVehicles
      );
      setLeafAllocation(leafAlloc);
      calculateTotalLeafPrice(leafAlloc);

      // Only initialize logistics allocation if it's empty
      if (logisticsAllocation.length === 0) {
        const logisticsAlloc = assignLogisticsAllocation(leafAlloc);
        setLogisticsAllocation(logisticsAlloc);
      }
    }
  }, [rfqDetails, enrichedQuotes]);

  useEffect(() => {
    if (quotes.length > 0 && vendors.length > 0) {
      const enriched = quotes.map((quote) => {
        const matchingVendor = vendors.find(
          (vendor) => vendor.vendorName === quote.vendorName
        );
        return {
          ...quote,
          companyName: matchingVendor
            ? matchingVendor.companyName || quote.vendorName
            : quote.vendorName,
          grade: matchingVendor ? matchingVendor.grade : "A",
        };
      });
      setEnrichedQuotes(enriched);
    }
  }, [quotes, vendors]);

  useEffect(() => {
    calculateTotalLogisticsPrice(logisticsAllocation);
  }, [logisticsAllocation]);

  const fetchRFQDetails = async () => {
    try {
      const response = await axios.get(
        `${API}/api/rfq/${rfqId}`
      );
      setRfqDetails(response.data);
      setRfqStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching RFQ details:", error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(
        `${API}/api/quotes/${rfqId}`
      );
      setQuotes(response.data);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(
        `${API}/api/vendors`
      );
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const getDisplayedLeafAllocations = () => {
    return leafAllocation;
  };

  const getDisplayedLogisticsAllocations = () => {
    return logisticsAllocation;
  };

  // Assign LEAF Allocation
  // Inside EvalRFQs.jsx

  const assignLeafAllocation = (quotes, requiredTrucks) => {
    if (!requiredTrucks || requiredTrucks <= 0) return quotes;

    // Define grade to score mapping
    const gradeScores = {
      A: 4,
      B: 3,
      C: 2,
      D: 1,
    };

    // Calculate max price for normalization
    const maxPrice = Math.max(...quotes.map((q) => q.price));

    // Enrich quotes with weighted score
    const quotesWithScores = quotes.map((quote) => {
      const priceScore = maxPrice / quote.price; // Invert price for scoring
      const gradeScore = gradeScores[quote.grade] || 4; // Default to 4 if undefined
      const weightedScore = priceScore * 0.6 + gradeScore * 0.4;
      return {
        ...quote,
        priceScore,
        gradeScore,
        weightedScore,
      };
    });

    // Sort quotes by weighted score (descending)
    const sortedQuotes = quotesWithScores.sort(
      (a, b) => b.weightedScore - a.weightedScore
    );

    let totalTrucks = 0;

    return sortedQuotes.map((quote, index) => {
      if (totalTrucks < requiredTrucks) {
        const trucksToAllot = Math.min(
          quote.numberOfTrucks,
          requiredTrucks - totalTrucks
        );
        totalTrucks += trucksToAllot;
        return {
          ...quote,
          label: `L${index + 1}`,
          trucksAllotted: trucksToAllot,
        };
      }
      return { ...quote, label: "-", trucksAllotted: 0 };
    });
  };

  // Assign Logistics Allocation (Labels assigned automatically)
  const assignLogisticsAllocation = (leafAlloc) => {
    // Assign labels automatically based on price (ascending)
    const sortedAllocations = [...leafAlloc].sort((a, b) => a.price - b.price);
    return sortedAllocations.map((alloc, index) => ({
      vendorName: alloc.vendorName,
      companyName: alloc.companyName,
      trucksOffered: alloc.numberOfTrucks,
      price: alloc.price,
      trucksAllotted: alloc.trucksAllotted,
      label: `L${index + 1}`,
      numberOfVehiclesPerDay: alloc.numberOfVehiclesPerDay,
    }));
  };

  // Calculate Total LEAF Price
  const calculateTotalLeafPrice = (allocations) => {
    const total = allocations.reduce(
      (sum, quote) => sum + quote.price * quote.trucksAllotted,
      0
    );
    setTotalLeafPrice(total);
  };

  // Handle Logistics Allocation Inputs
  const handleLogisticsInputChange = (index, field, value) => {
    setLogisticsAllocation((prevAllocations) => {
      const updatedAllocations = [...prevAllocations];
      updatedAllocations[index][field] =
        field === "price" ? parseFloat(value) : parseInt(value);
      return updatedAllocations;
    });
  };

  // Calculate Total Logistics Price
  const calculateTotalLogisticsPrice = (allocations) => {
    const total = allocations.reduce(
      (sum, alloc) => sum + alloc.price * alloc.trucksAllotted,
      0
    );
    setTotalLogisticsPrice(total);
  };

  // Finalize Allocation
  const finalizeAllocation = async () => {
    // Prepare data for comparison
    const leafAllocData = leafAllocation.map((alloc) => ({
      vendorName: alloc.vendorName,
      trucksAllotted: alloc.trucksAllotted,
    }));
    const logisticsAllocData = logisticsAllocation.map((alloc) => ({
      vendorName: alloc.vendorName,
      trucksAllotted: alloc.trucksAllotted,
    }));

    // Check if Logistics Allocation matches LEAF Allocation
    const isIdentical =
      JSON.stringify(leafAllocData) === JSON.stringify(logisticsAllocData);

    if (!isIdentical && finalizeReason.trim() === "") {
      alert("Please provide a reason for the difference in allocation.");
      return;
    }

    setIsFinalizing(true);

    try {
      const response = await axios.post(
        `${API}/api/rfq/${rfqId}/finalize-allocation`,
        {
          logisticsAllocation,
          finalizeReason: isIdentical ? "" : finalizeReason,
        }
      );

      setStatusMessage("Allocation finalized and emails sent to vendors.");
      setIsFinalizeModalOpen(false);
      // Optionally, redirect or update the RFQ status
    } catch (error) {
      console.error("Error finalizing allocation:", error);
      setStatusMessage("Failed to finalize allocation.");
    } finally {
      setIsFinalizing(false);
    }
  };

  // Check if all trucks are allotted
  const totalTrucksAllotted = logisticsAllocation.reduce(
    (sum, alloc) => sum + (alloc.trucksAllotted || 0),
    0
  );

  const allTrucksAllotted =
    totalTrucksAllotted === rfqDetails?.numberOfVehicles;

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

          {/* LEAF Allocation */}
          <div>
            <h3 className="font-bold mb-2">LEAF Allocation</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-black">
                <thead className="bg-green-600 rounded-lg">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Transporter
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Trucks Offered
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Vehicle Mobilisation Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Quote
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Trucks Allotted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black">
                  {getDisplayedLeafAllocations().map((quote) => (
                    <tr key={quote._id} className="hover:bg-blue-200">
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          evaluationPeriodEnded
                            ? "text-black"
                            : "filter blur-sm text-gray-500"
                        }`}
                      >
                        {quote.companyName || quote.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.grade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.numberOfTrucks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.numberOfVehiclesPerDay}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          evaluationPeriodEnded
                            ? "text-black"
                            : "filter blur-sm text-gray-500"
                        }`}
                      >
                        {quote.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {quote.trucksAllotted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Total LEAF Price */}
            <div className="mt-2">
              <p className="text-right font-bold">
                Total LEAF Price: {totalLeafPrice}
              </p>
            </div>
          </div>

          {/* Logistics Allocation */}
          <div className="mt-8">
            <h3 className="font-bold mb-2">Logistics Allocation</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-black">
                <thead className="bg-blue-600 rounded-lg">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Transporter
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Trucks Offered
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Vehicle Mobilisation Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Quote
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                      Trucks Allotted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black">
                  {getDisplayedLogisticsAllocations().map((alloc, index) => (
                    <tr key={index} className="hover:bg-blue-200">
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          evaluationPeriodEnded
                            ? "text-black"
                            : "filter blur-sm text-gray-500"
                        }`}
                      >

                        {alloc.companyName || alloc.vendorName}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {alloc.trucksOffered}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {alloc.numberOfVehiclesPerDay}
                      </td>

                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          evaluationPeriodEnded
                            ? "text-black"
                            : "filter blur-sm text-gray-500"
                        }`}
                      >
                        <input
                          type="number"
                          value={alloc.price}
                          onChange={(e) =>
                            handleLogisticsInputChange(
                              index,
                              "price",
                              e.target.value
                            )
                          }
                          className="p-1 border"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {alloc.label}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <input
                          type="number"
                          value={alloc.trucksAllotted}
                          onChange={(e) =>
                            handleLogisticsInputChange(
                              index,
                              "trucksAllotted",
                              e.target.value
                            )
                          }
                          className="p-1 border"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Total Logistics Price */}
            <div className="mt-2">
              <p className="text-right font-bold">
                Total Logistics Price: {totalLogisticsPrice}
              </p>
            </div>
          </div>

          {/* Finalize Button */}
          <div className="mt-6 flex justify-center">
            <button
              className={`text-white bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded-full ml-2 ${
                allTrucksAllotted ? "" : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => setIsFinalizeModalOpen(true)}
              disabled={!allTrucksAllotted}
            >
              Finalize
            </button>
          </div>

          {/* Finalize Modal */}
          {isFinalizeModalOpen && (
            <div className="fixed z-50 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div className="bg-white p-6 rounded-lg shadow-lg w-3/4">
                  <h2 className="text-xl font-bold mb-4">
                    Finalize Allocation
                  </h2>
                  {/* Display Logistics Allocation */}
                  <table className="min-w-full divide-y divide-black mt-4">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Vendor Name
                        </th>

                        <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Price
                        </th>

                        <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Trucks Allotted
                        </th>

                        <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Label
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-black">
                      {logisticsAllocation
                        .filter((alloc) => alloc.trucksAllotted > 0)
                        .map((alloc, index) => (
                          <tr key={index}>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                evaluationPeriodEnded
                                  ? "text-black"
                                  : "filter blur-sm text-gray-500"
                              }`}
                            >
                              {alloc.vendorName}
                            </td>

                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                evaluationPeriodEnded
                                  ? "text-black"
                                  : "filter blur-sm text-gray-500"
                              }`}
                            >
                              {alloc.price}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {alloc.trucksAllotted}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {alloc.label}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {/* Reason Input if allocations differ */}
                  {!(
                    JSON.stringify(
                      leafAllocation.map((alloc) => ({
                        vendorName: alloc.vendorName,
                        trucksAllotted: alloc.trucksAllotted,
                      }))
                    ) ===
                    JSON.stringify(
                      logisticsAllocation.map((alloc) => ({
                        vendorName: alloc.vendorName,
                        trucksAllotted: alloc.trucksAllotted,
                      }))
                    )
                  ) && (
                    <div className="mt-4">
                      <label className="font-bold">
                        Please provide a reason for the difference in
                        allocation:
                      </label>
                      <textarea
                        value={finalizeReason}
                        onChange={(e) => setFinalizeReason(e.target.value)}
                        className="w-full p-2 border mt-2"
                        rows="4"
                      ></textarea>
                    </div>
                  )}
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
                      onClick={finalizeAllocation}
                      disabled={isFinalizing}
                    >
                      {isFinalizing ? "Finalizing..." : "Finalize Allocation"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
