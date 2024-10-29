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
  const [validityPeriod, setvalidityPeriod] = useState("");
  const [rfqDetails, setRfqDetails] = useState(null);
  const [vendorQuote, setVendorQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [minTrucksRequired, setMinTrucksRequired] = useState(0);
  const [rfqStatus, setRfqStatus] = useState("");
  const [l1Price, setL1Price] = useState(null);
  const [isInitialQuoteSubmitted, setIsInitialQuoteSubmitted] = useState(false);
  const [numberOfVehiclesPerDay, setNumberOfVehiclesPerDay] = useState("");

  // fetch rfq details and quote from backend
  useEffect(() => {
    const fetchRFQDetails = async () => {
      // fetch rfq details from backend
      try {
        const response = await axios.get(
          `https://petp.onrender.com/api/rfq/${rfqId}`
        );
        setRfqDetails(response.data);
        setRfqStatus(response.data.status);
        setL1Price(response.data.l1Price);

        // Calculate minimum trucks required (39% of total, rounded down)
        const minTrucks = Math.ceil(0.39 * response.data.numberOfVehicles);
        setMinTrucksRequired(minTrucks);

        // fetch quote and number of trucks from backend
        const quoteResponse = await axios.get(
          `https://petp.onrender.com/api/quotes/${rfqId}`
        );
        const existingQuote = quoteResponse.data.find(
          (q) => q.vendorName === username
        );
        // set quote, number of trucks and message
        if (existingQuote) {
          setIsInitialQuoteSubmitted(true);
          setQuote(existingQuote.price);
          setNumberOfTrucks(existingQuote.numberOfTrucks);
          setNumberOfVehiclesPerDay(
            existingQuote.numberOfVehiclesPerDay != null
              ? existingQuote.numberOfVehiclesPerDay.toString()
              : ""
          );
          setvalidityPeriod(existingQuote.validityPeriod);
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
    setErrors({});

    let hasError = false;
    const newErrors = {};

    // type-checking

    if (!numberOfVehiclesPerDay || numberOfVehiclesPerDay.trim() === '') {
      newErrors.numberOfVehiclesPerDay = 'Number of Vehicles per Day is required.';
      hasError = true;
    }    

    if (!/^\d+$/.test(quote)) {
      newErrors.quote = "Quote must contain only digits.";
      hasError = true;
    }
    
    if (!/^\d+$/.test(numberOfTrucks)) {
      newErrors.numberOfTrucks = "Number of Trucks must contain only digits.";
      hasError = true;
    } else if (parseInt(numberOfTrucks) < minTrucksRequired) {
      newErrors.numberOfTrucks = `Number of Trucks must be at least ${minTrucksRequired}.`;
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // set loading state
    setIsLoading(true);
    try {
      const quoteData = {
        rfqId,
        quote,
        validityPeriod,
        message,
        vendorName: username,
        numberOfTrucks: Number(numberOfTrucks),
        numberOfVehiclesPerDay: Number(numberOfVehiclesPerDay),
      };

      // update existing quote or create new quote
      if (vendorQuote) {
        await axios.put(
          `https://petp.onrender.com/api/quote/${vendorQuote._id}`,
          quoteData
        );
        alert("Quote updated successfully!");
      } else {
        await axios.post("https://petp.onrender.com/api/quote", quoteData);
        alert("Quote submitted successfully!");
      }

      // navigate to vendor rfq list
      navigate("/vendor-rfq-list");
    } catch (error) {
      console.error("Error submitting quote:", error);
      if (error.response && error.response.data && error.response.data.error) {
        // if the error comes from backend validation
        setErrors({ submit: error.response.data.error });
      } else {
        alert("Failed to submit quote. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "numberOfVehiclesPerDay") {
      if (!/^\d{0,2}$/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          numberOfVehiclesPerDay: "Must be a number between 1 and 99.",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          numberOfVehiclesPerDay: "",
        }));
      }
      setNumberOfVehiclesPerDay(value);
    }

    // set quote, number of trucks and message
    if (name === "quote") {
      if (!/^\d*$/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          quote: "Quote must contain only digits.",
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, quote: "" }));
      }
      setQuote(value);
    }

    // set number of trucks
    if (name === "numberOfTrucks") {
      if (!/^\d*$/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          numberOfTrucks: "Number of Trucks must contain only digits.",
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, numberOfTrucks: "" }));
      }
      setNumberOfTrucks(value);
    }

    if (name === "validityPeriod") {
      if (!/^\d{0,3}$/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          validityPeriod: "Validity period must be a number up to 3 digits.",
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, validityPeriod: "" }));
      }
      setvalidityPeriod(value);
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

  // Conditional rendering based on RFQ status
  if (rfqStatus === "initial") {
    // Allow initial quote submission (continue to render the form below)
  } else if (rfqStatus === "evaluation") {
    if (!isInitialQuoteSubmitted) {
      return (
        <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">
            You did not submit an initial quote. You cannot update your quote
            now.
          </h2>
        </div>
      );
    }
    if (username === rfqDetails.l1VendorId) {
      return (
        <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">
            Your price is locked as L1. You cannot update your quote.
          </h2>
        </div>
      );
    }

    return (
      <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          Update Your Quote (No Regret Price)
        </h2>
        <p className="text-center mb-4">L1 Price is: {l1Price}</p>
        {/* Render the form to submit "No Regret Price" */}
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
            {errors.quote && (
              <p className="text-red-700 text-sm font-bold mt-1">
                {errors.quote}
              </p>
            )}
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
              min={minTrucksRequired}
            />
            <p className="text-gray-600 text-sm mt-1">
              Please enter at least {minTrucksRequired} trucks.
            </p>
            {errors.numberOfTrucks && (
              <p className="text-red-700 text-sm font-bold mt-1">
                {errors.numberOfTrucks}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1">
              How long is your quote valid (in days)?
            </label>
            <input
              type="number"
              name="validityPeriod"
              value={validityPeriod}
              onChange={handleInputChange}
              className="w-full p-1 border border-gray-300 rounded"
              disabled={isLoading}
            />
            {errors.validityPeriod && (
              <p className="text-red-700 text-sm font-bold mt-1">
                {errors.validityPeriod}
              </p>
            )}
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

          {errors.submit && (
            <p className="text-red-700 text-sm font-bold mt-1">
              {errors.submit}
            </p>
          )}

          <button
            type="submit"
            className={`w-full p-2 bg-indigo-500 text-white rounded ${
              isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Update Quote"}
          </button>
        </form>
      </div>
    );
  } else {
    return (
      <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          The RFQ is closed. You cannot submit a quote.
        </h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 px-4 py-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        Submit Quote for {rfqDetails.RFQNumber}
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
          {errors.quote && (
            <p className="text-red-700 text-sm font-bold mt-1">
              {errors.quote}
            </p>
          )}
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
            min={minTrucksRequired}
          />
          <p className="text-gray-600 text-sm mt-1">
            Please enter at least {minTrucksRequired} trucks.
          </p>
          {errors.numberOfTrucks && (
            <p className="text-red-700 text-sm font-bold mt-1">
              {errors.numberOfTrucks}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-1">
            Number of Vehicles You Will Provide Per Day
          </label>
          <input
            type="number"
            name="numberOfVehiclesPerDay"
            value={numberOfVehiclesPerDay}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
            disabled={isLoading}
            min={1}
            max={99}
          />
          {errors.numberOfVehiclesPerDay && (
            <p className="text-red-700 text-sm font-bold mt-1">
              {errors.numberOfVehiclesPerDay}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-1">How long is your quote valid?</label>
          <textarea
            name="validityPeriod"
            value={validityPeriod}
            onChange={handleInputChange}
            className="w-full p-1 border border-gray-300 rounded"
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

        {errors.submit && (
          <p className="text-red-700 text-sm font-bold mt-1">{errors.submit}</p>
        )}

        <button
          type="submit"
          className={`w-full p-2 bg-indigo-500 text-white rounded ${
            isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading
            ? "Submitting..."
            : vendorQuote
            ? "Update Quote"
            : "Submit Quote"}
        </button>
      </form>
    </div>
  );
};

export default VendorQuoteForm;