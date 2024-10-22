import React, { useEffect, useState } from "react";
import axios from "axios";

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [factoryUsers, setFactoryUsers] = useState([]);

  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showFactoryForm, setShowFactoryForm] = useState(false);

  const [vendorError, setVendorError] = useState("");
  const [factoryError, setFactoryError] = useState("");

  // Vendor form state
  const [vendorFormData, setVendorFormData] = useState({
    username: "",
    password: "",
    email: "",
    contactNumber: "",
  });

  // Factory user form state
  const [factoryFormData, setFactoryFormData] = useState({
    username: "",
    password: "",
    email: "",
    contactNumber: "",
  });

  useEffect(() => {
    fetchVendors();
    fetchFactoryUsers();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get("https://petp.onrender.com/api/vendors");
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchFactoryUsers = async () => {
    try {
      const response = await axios.get(
        "https://petp.onrender.com/api/factory-users"
      );
      setFactoryUsers(response.data);
    } catch (error) {
      console.error("Error fetching factory users:", error);
    }
  };

  const addVendor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://petp.onrender.com/api/add-vendor",
        vendorFormData
      );
      fetchVendors();
      setVendorFormData({
        username: "",
        password: "",
        email: "",
        contactNumber: "",
      });
      setShowVendorForm(false);
      setVendorError("");
    } catch (error) {
      console.error("Error adding vendor:", error);
      setVendorError(error.response?.data?.details || "An error occurred");
    }
  };

  const addFactoryUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://petp.onrender.com/api/add-factory-user", factoryFormData);
      fetchFactoryUsers();
      setFactoryFormData({ username: "", password: "", email: "", contactNumber: "" });
      setShowFactoryForm(false);
      setFactoryError("");
    } catch (error) {
      console.error("Error adding factory user:", error);
      setFactoryError(error.response?.data?.details || "An error occurred");
    }
  };

  const deleteVendor = async (id) => {
    try {
      await axios.delete(`https://petp.onrender.com/api/vendors/${id}`);
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
    }
  };

  const deleteFactoryUser = async (id) => {
    try {
      await axios.delete(`https://petp.onrender.com/api/factory-users/${id}`);
      fetchFactoryUsers();
    } catch (error) {
      console.error("Error deleting factory user:", error);
    }
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      {/* Vendors Table */}
      <h2 className="text-2xl font-bold text-center mb-6">Vendor List</h2>
      {/* New Vendor Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowVendorForm(!showVendorForm)}
          className="bg-indigo-500 hover:bg-green-500 text-white px-4 py-2 rounded"
        >
          {showVendorForm ? "Cancel" : "New +"}
        </button>
      </div>
      {/* Vendor Form */}
      {showVendorForm && (
        <form onSubmit={addVendor} className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-lg shadow-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={vendorFormData.username}
              onChange={(e) =>
                setVendorFormData({
                  ...vendorFormData,
                  username: e.target.value,
                })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={vendorFormData.password}
              onChange={(e) =>
                setVendorFormData({
                  ...vendorFormData,
                  password: e.target.value,
                })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
            <input
              type="email"
              placeholder="Email"
              value={vendorFormData.email}
              onChange={(e) =>
                setVendorFormData({ ...vendorFormData, email: e.target.value })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={vendorFormData.contactNumber}
              onChange={(e) =>
                setVendorFormData({
                  ...vendorFormData,
                  contactNumber: e.target.value,
                })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
          </div>
          {vendorError && <p className="text-red-500">{vendorError}</p>}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="bg-white text-black px-4 py-2 rounded font-bold border-black hover:bg-black hover:text-white"
            >
              Add Vendor
            </button>
          </div>
        </form>
        
      )}
      {/* Vendors Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Contact Number
              </th>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black">
            {vendors.map((vendor) => (
              <tr key={vendor._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {vendor.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {vendor.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {vendor.contactNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  <button
                    onClick={() => deleteVendor(vendor._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Factory Users Table */}
      <h2 className="text-2xl font-bold text-center my-6">Factory Users</h2>
      {/* New Factory User Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowFactoryForm(!showFactoryForm)}
          className="bg-indigo-500 hover:bg-green-500 text-white px-4 py-2 rounded"
        >
          {showFactoryForm ? "Cancel" : "New +"}
        </button>
      </div>
      {/* Factory User Form */}
      {showFactoryForm && (
        <form onSubmit={addFactoryUser} className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-lg shadow-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={factoryFormData.username}
              onChange={(e) =>
                setFactoryFormData({
                  ...factoryFormData,
                  username: e.target.value,
                })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={factoryFormData.password}
              onChange={(e) =>
                setFactoryFormData({
                  ...factoryFormData,
                  password: e.target.value,
                })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
            <input
              type="email"
              placeholder="Email"
              value={factoryFormData.email}
              onChange={(e) =>
                setFactoryFormData({
                  ...factoryFormData,
                  email: e.target.value,
                })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={factoryFormData.contactNumber}
              onChange={(e) =>
                setFactoryFormData({
                  ...factoryFormData,
                  contactNumber: e.target.value,
                })
              }
              required
              className="p-2 border border-black rounded text-white bg-gray-700 hover:bg-white hover:text-black"
            />
          </div>
          {factoryError && <p className="text-red-500">{factoryError}</p>}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="bg-white text-black px-4 py-2 rounded font-bold border-black hover:bg-black hover:text-white"
            >
              Add Factory User
            </button>
          </div>
        </form>
      )}
      {/* Factory Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Contact Number
              </th>
              <th className="px-6 py-3 text-left text-sm text-black font-bold uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black">
            {factoryUsers.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {user.contactNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  <button
                    onClick={() => deleteFactoryUser(user._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorList;