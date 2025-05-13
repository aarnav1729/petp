// LRNumberSubmission.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const LRNumberSubmission = ({ username }) => {
  const { rfqId } = useParams();
  const [rfqDetails, setRfqDetails] = useState(null);
  const [lrNumbers, setLrNumbers] = useState([]);
  const [trucksAllotted, setTrucksAllotted] = useState(0);
  const [statusMessages, setStatusMessages] = useState({});

  useEffect(() => {
    const fetchRfqDetails = async () => {
      try {
        const response = await axios.get(
          `https://leaf-tn20.onrender.com/api/vendor/rfq/${rfqId}/details/${username}`
        );
        setRfqDetails(response.data.rfq);
        setTrucksAllotted(response.data.trucksAllotted);
        setLrNumbers(response.data.lrNumbers || []);
      } catch (error) {
        console.error("Error fetching RFQ details:", error);
      }
    };

    fetchRfqDetails();
  }, [rfqId, username]);

  const handleLrNumberChange = (index, value) => {
    const updatedLrNumbers = [...lrNumbers];
    updatedLrNumbers[index] = value;
    setLrNumbers(updatedLrNumbers);
  };

  const handleIndividualSubmit = async (index) => {
    const lrNumber = lrNumbers[index];
    if (!lrNumber || lrNumber.trim() === "") {
      setStatusMessages((prev) => ({
        ...prev,
        [index]: "Please enter a valid LR Number.",
      }));
      return;
    }

    try {
      await axios.post(
        `https://leaf-tn20.onrender.com/api/vendor/rfq/${rfqId}/submit-lr-number`,
        {
          username,
          index,
          lrNumber,
        }
      );
      setStatusMessages((prev) => ({
        ...prev,
        [index]: "LR Number submitted successfully!",
      }));
    } catch (error) {
      console.error("Error submitting LR Number:", error);
      setStatusMessages((prev) => ({
        ...prev,
        [index]: "Failed to submit LR Number.",
      }));
    }
  };

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      {rfqDetails ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Submit LR Numbers for RFQ {rfqDetails.RFQNumber}
          </h2>
          <p className="mb-4">
            Trucks Allotted: <strong>{trucksAllotted}</strong>
          </p>
          {[...Array(trucksAllotted)].map((_, index) => (
            <div key={index} className="mb-2 flex items-center">
              <label>LR Number {index + 1}:</label>
              <input
                type="text"
                value={lrNumbers[index] || ""}
                onChange={(e) => handleLrNumberChange(index, e.target.value)}
                className="ml-2 p-1 border"
              />
              <button
                onClick={() => handleIndividualSubmit(index)}
                className="ml-4 bg-blue-500 text-white px-2 py-1 rounded"
              >
                Submit
              </button>
              {statusMessages[index] && (
                <span className="ml-2 text-green-600 font-bold">
                  {statusMessages[index]}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>Loading RFQ details...</p>
      )}
    </div>
  );
};

export default LRNumberSubmission;