import React, { useEffect, useState } from "react";
import axios from "axios";
const API = "https://14.194.111.58:10443";
const Accounts = () => {
  const [pendingAccounts, setPendingAccounts] = useState([]);

  useEffect(() => {
    fetchPendingAccounts();
  }, []);

  const fetchPendingAccounts = async () => {
    try {
      const response = await axios.get(`${API}/api/pending-accounts`);
      setPendingAccounts(response.data);
    } catch (error) {
      console.error("Error fetching pending accounts:", error);
    }
  };

  const approveAccount = async (id) => {
    try {
      await axios.post(`${API}/api/approve-account/${id}`);
      // remove the approved account from the list
      setPendingAccounts(pendingAccounts.filter((account) => account._id !== id));
    } catch (error) {
      console.error("Error approving account:", error);
    }
  };

  const declineAccount = async (id) => {
    try {
      await axios.post(`${API}/api/decline-account/${id}`);
      // remove the declined account from the list
      setPendingAccounts(pendingAccounts.filter((account) => account._id !== id));
    } catch (error) {
      console.error("Error declining account:", error);
    }
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Pending Accounts</h2>
      {pendingAccounts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white rounded-full">
            <thead className="bg-green-600 rounded-full">
              <tr>
                {["Username", "Email", "Contact Number", "Role", "Actions"].map((header) => (
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
              {pendingAccounts.map((account) => (
                <tr key={account._id} className="hover:bg-blue-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {account.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {account.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {account.contactNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {account.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    <button
                      onClick={() => approveAccount(account._id)}
                      className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineAccount(account._id)}
                      className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded ml-2"
                    >
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-xl">No pending accounts.</p>
      )}
    </div>
  );
};

export default Accounts;