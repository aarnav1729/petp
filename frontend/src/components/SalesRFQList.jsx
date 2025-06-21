// SalesOrders.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const SalesOrders = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    projectCapacity: "",
    siteLocation: "",
    budgetedPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [overrideFlag, setOverrideFlag] = useState(false); // Added state for override flag

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  useEffect(() => {
    // Log to verify that overrideFlag is updated properly
    console.log("Override Flag in SalesOrders.jsx:", overrideFlag);
  }, [overrideFlag]);

  const fetchSalesOrders = async () => {
    try {
      const response = await axios.get(
        "https://leaf-tn20.onrender.com/api/sales/orders"
      );
      setSalesOrders(response.data);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    }
  };

  // Inside handleToggle method, ensure overrideFlag is updated correctly
  const handleToggle = async (projectCode, canOverride) => {
    try {
      const newOverrideValue = !canOverride;
      console.log("Override Flag Toggled:", newOverrideValue);

      // Update the override flag value
      await axios.patch(
        `https://leaf-tn20.onrender.com/api/sales/orders/${projectCode}/override`,
        { canOverride: newOverrideValue }
      );

      // Refresh sales orders after toggle
      fetchSalesOrders();
      setOverrideFlag(newOverrideValue); // Update the state for overrideFlag
    } catch (error) {
      console.error("Error updating canOverride flag:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData({
      customerName: "",
      projectCapacity: "",
      siteLocation: "",
      budgetedPrice: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Compute projectCode by concatenating customerName, projectCapacity, and siteLocation
      const projectCode = `${formData.customerName}-${formData.projectCapacity}-${formData.siteLocation}`;
      await axios.post("https://leaf-tn20.onrender.com/api/sales/orders", {
        customerName: formData.customerName,
        projectCapacity: parseFloat(formData.projectCapacity),
        siteLocation: formData.siteLocation,
        budgetedPrice: parseFloat(formData.budgetedPrice),
        projectCode, // send the computed project code
      });
      fetchSalesOrders();
      closeModal();
    } catch (error) {
      console.error("Error creating sales order:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button
          onClick={openModal}
          className="bg-green-600 text-white px-4 py-2 rounded transition duration-300 hover:bg-green-700"
        >
          Create New
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-green-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                Project Code
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                Budgeted Price (INR/Wp)
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                Allow MW Override
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salesOrders.map((order) => (
              <tr
                key={order._id}
                className="hover:bg-blue-200 transition duration-200 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.projectCode || order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.budgetedPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={order.canOverride}
                      onChange={() =>
                        handleToggle(order.projectCode, order.canOverride)
                      }
                      className="form-checkbox"
                    />
                    <span className="ml-2">Enable Override</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md transform transition-all duration-300">
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Project Capacity (MW)
                </label>
                <input
                  type="number"
                  name="projectCapacity"
                  value={formData.projectCapacity}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  step="any"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Site Location</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={formData.siteLocation}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Budgeted Price (INR/Wp)
                </label>
                <input
                  type="number"
                  name="budgetedPrice"
                  value={formData.budgetedPrice}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  step="any"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="mr-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;