// import required modules
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// create and export vendor quote form component
const VendorQuoteForm = ({ username }) => {
  // get rfqid from url parameters
  const { rfqId } = useParams();
  // create state variables for quote, message, number of trucks, rfq details and vendor quote
  const navigate = useNavigate();
  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState("");
  const [numberOfTrucks, setNumberOfTrucks] = useState("");
  const [rfqDetails, setRfqDetails] = useState(null);
  const [vendorQuote, setVendorQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // fetch rfq details and quote from backend
  useEffect(() => {
    const fetchRFQDetails = async () => {
      // fetch rfq details from backend
      try {
        const response = await axios.get(`https://petp.onrender.com/api/rfq/${rfqId}`);
        setRfqDetails(response.data);

        // fetch quote and number of trucks from backend
        const quoteResponse = await axios.get(`https://petp.onrender.com/api/quotes/${rfqId}`);
        const existingQuote = quoteResponse.data.find(q => q.vendorName === username);
        // set quote, number of trucks and message
        if (existingQuote) {
          setQuote(existingQuote.price);
          setNumberOfTrucks(existingQuote.numberOfTrucks);
          setMessage(existingQuote.message);
          setVendorQuote(existingQuote);
        }
      } catch (error) {
        console.error("Error fetching RFQ details or quotes:", error);
      }
    };

    fetchRFQDetails();
  }, [rfqId, username]);

  // handle quote submission
  const handleQuoteSubmit = async (e) => {
    // prevent default form submission
    e.preventDefault();

    // type-checking
    if (!/^\d+$/.test(quote)) {
      setErrors((prevErrors) => ({ ...prevErrors, quote: "Quote must contain only digits." }));
      return;
    }
    if (!/^\d+$/.test(numberOfTrucks)) {
      setErrors((prevErrors) => ({ ...prevErrors, numberOfTrucks: "Number of Trucks must contain only digits." }));
      return;
    }

    // set loading state
    setIsLoading(true); 
    try {
      const quoteData = {
        rfqId,
        quote,
        message,
        vendorName: username,
        numberOfTrucks: Number(numberOfTrucks),
      };

      // update existing quote or create new quote
      if (vendorQuote) {
        await axios.put(`https://petp.onrender.com/api/quote/${vendorQuote._id}`, quoteData);
        alert("Quote updated successfully!");
      } else {
        await axios.post("https://petp.onrender.com/api/quote", quoteData);
        alert("Quote submitted successfully!");
      }

      // navigate to vendor rfq list
      navigate("/vendor-rfq-list");
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("Failed to submit quote. Please try again.");
    } finally {
      setIsLoading(false); 
    }
  };

  // handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // set quote, number of trucks and message
    if (name === "quote") {
      if (!/^\d*$/.test(value)) {
        setErrors((prevErrors) => ({ ...prevErrors, quote: "Quote must contain only digits." }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, quote: "" }));
      }
      setQuote(value);
    }

    // set number of trucks
    if (name === "numberOfTrucks") {
      if (!/^\d*$/.test(value)) {
        setErrors((prevErrors) => ({ ...prevErrors, numberOfTrucks: "Number of Trucks must contain only digits." }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, numberOfTrucks: "" }));
      }
      setNumberOfTrucks(value);
    }

    // set message
    if (name === "message") {
      setMessage(value);
    }
  };

  // return loading message if rfq details are not fetched
  if (!rfqDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        Submit Quote for RFQ {rfqDetails.RFQNumber}
      </h2>
      <form onSubmit={handleQuoteSubmit} className="mt-4">
        <div className="mb-4">
          <label className="block mb-1">Quote Per Truck</label>
          <input
            type="number"
            name="quote"
            value={quote}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
            disabled={isLoading}
          />
          {errors.quote && <p className="text-red-700 text-sm font-bold mt-1">{errors.quote}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-1">Number of Trucks</label>
          <input
            type="number"
            name="numberOfTrucks"
            value={numberOfTrucks}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
            disabled={isLoading}
          />
          {errors.numberOfTrucks && <p className="text-red-700 text-sm font-bold mt-1">{errors.numberOfTrucks}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-1">How long is your quote valid?</label>
          <textarea
            name="message"
            value={message}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isLoading}
          />
        </div>
      
        <div className="mb-4">
          <label className="block mb-1">Message (Optional)</label>
          <textarea
            name="message"
            value={message}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className={`w-full p-2 bg-blue-500 text-white rounded ${
            isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : vendorQuote ? "Update Quote" : "Submit Quote"}
        </button>
      </form>
    </div>
  );
};

export default VendorQuoteForm;