// ./components/SalesOrders.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesOrders = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '',
    quantity: '',
    customerName: '',
    // New pricing fields moved here:
    budgetedPriceBySalesDept: '',
    maxAllowablePrice: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      const response = await axios.get('https://leaf-tn20.onrender.com/api/sales/orders');
      setSalesOrders(response.data);
    } catch (error) {
      console.error('Error fetching sales orders:', error);
    }
  };

  const handleToggle = async (projectCode, canOverride) => {
    try {
      await axios.patch(
        `https://leaf-tn20.onrender.com/api/sales/orders/${projectCode}/override`,
        { canOverride: !canOverride }
      );
      fetchSalesOrders(); // Refresh sales orders after toggle
    } catch (error) {
      console.error('Error updating canOverride flag:', error);
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
      orderNumber: '',
      quantity: '',
      customerName: '',
      budgetedPriceBySalesDept: '',
      maxAllowablePrice: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('https://leaf-tn20.onrender.com/api/sales/orders', {
        orderNumber: formData.orderNumber,
        quantity: parseFloat(formData.quantity),
        customerName: formData.customerName,
        // Pass along the pricing fields:
        budgetedPriceBySalesDept: parseFloat(formData.budgetedPriceBySalesDept),
        maxAllowablePrice: parseFloat(formData.maxAllowablePrice),
      });
      fetchSalesOrders();
      closeModal();
    } catch (error) {
      console.error('Error creating sales order:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales Orders</h2>
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
                Order Number
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                Quantity (MW)
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">
                Customer Name
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
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={order.canOverride}
                      onChange={() => handleToggle(order.projectCode, order.canOverride)}
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
            <h3 className="text-xl font-bold mb-4">Create New Sales Order</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Order Number</label>
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Quantity (MW)</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  step="any"
                  required
                />
              </div>
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
              {/* New pricing fields */}
              <div className="mb-4">
                <label className="block text-gray-700">
                  Budgeted Price by Sales Dept.
                </label>
                <input
                  type="number"
                  name="budgetedPriceBySalesDept"
                  value={formData.budgetedPriceBySalesDept}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                  step="any"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Max Allowable Price
                </label>
                <input
                  type="number"
                  name="maxAllowablePrice"
                  value={formData.maxAllowablePrice}
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
                  {loading ? 'Submitting...' : 'Submit'}
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
