// VendorRFQList.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import debounce from "lodash/debounce";

const API = window.location.origin;

const VendorRFQList = ({ username }) => {
  const [rfqs, setRfqs] = useState([]);
  const [vendorQuotes, setVendorQuotes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  // Fetch vendor quotes
  const fetchVendorQuotes = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/quotes`);
      // filter quotes by vendor name
      const quotesByVendor = response.data.reduce((acc, quote) => {
        if (quote.vendorName === username) {
          acc[quote.rfqId] = quote;
        }
        return acc;
      }, {});
      setVendorQuotes(quotesByVendor);
    } catch (error) {
      console.error("Error fetching vendor quotes:", error);
    }
  }, [username]);

  // Fetch RFQs with server-side pagination
  // Fetch RFQs with server-side pagination
  const fetchRFQs = useCallback(
    async (page = 1, limit = 10, search = "", status = "") => {
      if (!username) return;

      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        if (search && search.trim() !== "") {
          params.append("search", search.trim());
        }

        if (status && status.trim() !== "") {
          params.append("status", status.trim());
        }

        console.log("Fetching vendor RFQs with params:", params.toString()); // Debug log

        const response = await axios.get(
          `${API}/api/rfqs/vendor/${username}?${params}`
        );

        console.log("Vendor RFQs response:", response.data); // Debug log

        // Handle response - check if it has the new structure with success flag
        if (response.data && response.data.success === true) {
          // New structure with success flag
          setRfqs(Array.isArray(response.data.data) ? response.data.data : []);
          setTotalCount(response.data.pagination?.totalCount || 0);
          setTotalPages(response.data.pagination?.totalPages || 1);
          setCurrentPage(response.data.pagination?.currentPage || page);
        } else if (Array.isArray(response.data)) {
          // Fallback for old structure - just an array
          console.log("Using fallback array response");
          setRfqs(response.data);
          setTotalCount(response.data.length);
          setTotalPages(Math.ceil(response.data.length / limit));
          setCurrentPage(page);
        } else {
          // Unexpected response format
          console.error("Unexpected response format:", response.data);
          setRfqs([]);
          setTotalCount(0);
          setTotalPages(1);
          setError("Received unexpected data format from server");
        }
      } catch (error) {
        console.error("Error fetching RFQs for vendor:", error);
        setError("Failed to fetch RFQs. Please try again later.");
        setRfqs([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [username]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    (value) => {
      const timeoutId = setTimeout(() => {
        fetchRFQs(1, rowsPerPage, value, filterStatus);
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [fetchRFQs, rowsPerPage, filterStatus]
  );

  // Handle search change with debounce
  useEffect(() => {
    const cleanup = debouncedSearch(searchTerm);
    return cleanup;
  }, [searchTerm, debouncedSearch]);

  // Initial fetch and quotes fetch
  useEffect(() => {
    if (username) {
      fetchRFQs(1, rowsPerPage, "", "");
      fetchVendorQuotes();
    }
  }, [username, fetchRFQs, fetchVendorQuotes]);

  // Handle filter status change
  useEffect(() => {
    if (username) {
      fetchRFQs(1, rowsPerPage, searchTerm, filterStatus);
    }
  }, [filterStatus, rowsPerPage, username, fetchRFQs, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleRowsPerPageChange = (e) => {
    const newLimit = Number(e.target.value);
    setRowsPerPage(newLimit);
    fetchRFQs(1, newLimit, searchTerm, filterStatus);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchRFQs(newPage, rowsPerPage, searchTerm, filterStatus);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePageInput = (e) => {
    const page = Number(e.target.value);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
    }
  };

  const handleQuoteClick = (e, rfqId, status) => {
    e.stopPropagation();
    if (status !== "closed") {
      navigate(`/vendor-quote-form/${rfqId}`);
    }
  };

  const handleRowClick = (rfqId) => {
    navigate(`/vendor-quote-form/${rfqId}`);
  };

  // Calculate showing range
  const showingFrom =
    totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingTo = Math.min(currentPage * rowsPerPage, totalCount);

  const tableHeaders = [
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
  ];

  if (isLoading && rfqs.length === 0) {
    return (
      <div className="container mx-auto mt-8 px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">RFQ List</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4 rounded-lg">
        <input
          type="text"
          placeholder="Search RFQs..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="text-black p-3 border bg-gray-200 border-blue-900 rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search RFQs"
          disabled={isLoading}
        />
        <select
          value={filterStatus}
          onChange={handleStatusChange}
          className="text-black p-3 border bg-gray-200 border-blue-900 rounded w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
          disabled={isLoading}
        >
          <option value="">All Statuses</option>
          <option value="initial">Initial</option>
          <option value="evaluation">Evaluation</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {rfqs.length === 0 && !isLoading ? (
        <p className="text-center text-black py-8">
          No RFQs found matching your criteria.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-600">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rfqs.map((rfq) => (
                  <tr
                    key={rfq._id}
                    onClick={() => handleRowClick(rfq._id)}
                    className="cursor-pointer hover:bg-blue-200 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {rfq.status !== "closed" ? (
                        <button
                          onClick={(e) =>
                            handleQuoteClick(e, rfq._id, rfq.status)
                          }
                          className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none"
                        >
                          {vendorQuotes[rfq._id]
                            ? "Update Quote"
                            : "View & Quote"}
                        </button>
                      ) : (
                        <span className="text-gray-500 cursor-not-allowed">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.RFQNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.shortName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.companyType || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.itemType || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.originLocation || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.dropLocationState || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.dropLocationDistrict || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.vehicleType || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.additionalVehicleDetails || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.numberOfVehicles || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {rfq.weight || "-"}
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

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
              <div className="flex items-center gap-4">
                {/* Rows per page selector */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="rowsPerPage"
                    className="text-sm text-gray-700"
                  >
                    Rows per page:
                  </label>
                  <select
                    id="rowsPerPage"
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    disabled={isLoading}
                    className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    aria-label="Rows per page"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Showing results info */}
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{showingFrom}</span>–
                  <span className="font-medium">{showingTo}</span> of{" "}
                  <span className="font-medium">{totalCount}</span> RFQs
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                  className={`px-3 py-1 rounded border text-sm transition-colors duration-150 ${
                    currentPage === 1 || isLoading
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }`}
                  aria-label="Previous page"
                >
                  Previous
                </button>

                {/* Page input */}
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700">Page</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={handlePageInput}
                    disabled={isLoading}
                    className="w-16 p-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    aria-label="Current page"
                  />
                  <span className="text-sm text-gray-700">of {totalPages}</span>
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoading}
                  className={`px-3 py-1 rounded border text-sm transition-colors duration-150 ${
                    currentPage === totalPages || isLoading
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  }`}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorRFQList;
