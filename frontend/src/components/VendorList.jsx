import React, { useEffect, useState } from "react";
import axios from "axios";

// vendor list component
const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    username: "",
    password: "",
    email: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // fetch vendors from backend
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await axios.get("https://petp.onrender.com/api/vendors");
        setVendors(response.data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };

    fetchVendors();
  }, []);

  // handle input change for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Type checking for validation
    let error = "";
    if (!value.trim()) {
      error = "This field is required";
    } else if (name === "username" && value.length < 3) {
      error = "Username must be at least 3 characters";
    } else if (name === "password" && value.length < 8) {
      error = "Password must be at least 8 characters";
    } else if (name === "email" && !value.includes("@")) {
      error = "Invalid email address";
    } else if (name === "contactNumber" && !/^\d+$/.test(value)) {
      error = "Contact number must contain only digits";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    setNewVendor((prevVendor) => ({ ...prevVendor, [name]: value }));
  };

  // handle add vendor form submission
  const handleAddVendor = async (e) => {
    e.preventDefault();

    // Validate form
    if (Object.values(errors).some((error) => error) || Object.values(newVendor).some((field) => !field)) {
      alert("Please fill all fields correctly.");
      return;
    }

    setIsLoading(true);

    // Send post request to add vendor
    try {
      const response = await axios.post("https://petp.onrender.com/api/add-vendor", newVendor);

      if (response.status === 201) {
        alert("Vendor added successfully!");
        setShowModal(false);
        setNewVendor({ username: "", password: "", email: "", contactNumber: "" });
        const response = await axios.get("https://petp.onrender.com/api/vendors");
        setVendors(response.data);
      } else {
        alert("Failed to add vendor. Please try again.");
      }
    } catch (error) {
      console.error("Error adding vendor:", error);
      alert("Failed to add vendor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // handle delete vendor button click
  const handleDeleteClick = async (vendor) => {
    const companyName = vendor.details?.companyName || vendor.username || "this vendor";

    if (window.confirm(`Are you sure you want to delete ${companyName}?`)) {
      try {
        await axios.delete(`https://petp.onrender.com/api/vendors/${vendor._id}`);
        alert("Vendor deleted successfully!");
        setVendors(vendors.filter((v) => v._id !== vendor._id));
      } catch (error) {
        console.error("Error deleting vendor:", error);
        alert("Failed to delete vendor. Please try again.");
      }
    }
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold items-center text-center mb-6">Vendor List</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-900"
        >
          New +
        </button>
      </div>
      <div className="overflow-x-auto rounded">
        <table className="min-w-full divide-y divide-black rounded-full">
          <thead className="bg-green-600 rounded-lg">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Actions
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Password
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase tracking-wider">
                Contact Number
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-black">
            {vendors.map((vendor) => (
              <tr key={vendor._id} className="cursor-pointer hover:bg-blue-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  <button
                    className="bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-800"
                    onClick={() => handleDeleteClick(vendor)}
                  >
                    Delete
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {vendor.username || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {vendor.password || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {vendor.email || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {vendor.contactNumber || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-white text-xl mb-4 text-center">Add New Vendor</h2>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="text-white block mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={newVendor.username}
                  onChange={handleInputChange}
                  className="text-black w-full p-2 border border-blue-200 rounded bg-gray-300"
                  required
                  disabled={isLoading}
                />
                {errors.username && <p className="text-red-700 text-sm font-bold mt-1">{errors.username}</p>}
              </div>
              <div>
                <label className="text-white block mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={newVendor.password}
                  onChange={handleInputChange}
                  className="text-black w-full p-2 border border-blue-200 rounded bg-gray-300"
                  required
                  disabled={isLoading}
                />
                {errors.password && <p className="text-red-700 text-sm font-bold mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="text-white block mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newVendor.email}
                  onChange={handleInputChange}
                  className="text-black w-full p-2 border border-blue-200 rounded bg-gray-300"
                  required
                  disabled={isLoading}
                />
                {errors.email && <p className="text-red-700 text-sm font-bold mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-white block mb-1">Contact Number</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={newVendor.contactNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-blue-200 rounded bg-gray-300"
                  required
                  disabled={isLoading}
                />
                {errors.contactNumber && <p className="text-red-700 text-sm font-bold mt-1">{errors.contactNumber}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-900"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-900 ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? "Adding Vendor..." : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;