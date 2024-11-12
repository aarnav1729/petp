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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [isAcceptButtonEnabled, setIsAcceptButtonEnabled] = useState(false);
  const [vendorDetails, setVendorDetails] = useState({});

  // fetch rfq details and quote from backend
  useEffect(() => {
    const fetchRFQDetails = async () => {
      // fetch rfq details from backend
      try {
        const response = await axios.get(
          `https://leaf-tn20.onrender.com/api/rfq/${rfqId}`
        );
        setRfqDetails(response.data);
        setRfqStatus(response.data.status);
        setL1Price(response.data.l1Price);

        // Calculate minimum trucks required (39% of total, rounded down)
        const minTrucks = Math.ceil(0.39 * response.data.numberOfVehicles);
        setMinTrucksRequired(minTrucks);

        // fetch quote and number of trucks from backend
        const quoteResponse = await axios.get(
          `https://leaf-tn20.onrender.com/api/quotes/${rfqId}`
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

  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        const response = await axios.get(
          `https://leaf-tn20.onrender.com/api/vendors/username/${username}`
        );
        setVendorDetails(response.data);
      } catch (error) {
        console.error("Error fetching vendor details:", error);
      }
    };

    fetchVendorDetails();
  }, [username]);

  // handle quote submission
  const handleQuoteSubmit = async (e) => {
    // prevent default form submission
    e.preventDefault();
    setErrors({});

    let hasError = false;
    const newErrors = {};

    // type-checking

    if (!numberOfVehiclesPerDay || numberOfVehiclesPerDay.trim() === "") {
      newErrors.numberOfVehiclesPerDay =
        "Number of Vehicles per Day is required.";
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
          `https://leaf-tn20.onrender.com/api/quote/${vendorQuote._id}`,
          quoteData
        );
        alert("Quote updated successfully!");
      } else {
        await axios.post("https://leaf-tn20.onrender.com/api/quote", quoteData);
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

  // Handle acceptance of terms and conditions
  const handleAcceptTerms = async () => {
    try {
      // Send request to backend to send the agreement email
      await axios.post("https://leaf-tn20.onrender.com/api/send-terms-agreement-email", {
        rfqId,
        vendorName: username,
        vendorEmail: vendorDetails.email, // Ensure vendorDetails.email is available
        rfqNumber: rfqDetails.RFQNumber,
        termsAndConditions: `
**TERMS AND CONDITIONS FOR DOMESTIC TRANSPORTATION SERVICES**

**E-bidding**
1. PREMIER ENERGIES will issue daily inquiries for trucks through our LEAF application. These inquiries will be sent to approved transporters for their responses.
2. The transporter must respond before the end of the time slot designated for submitting quotes. Upon submission, the application will display the transporter's relative competitive position (L1, L2, etc.). The transporter may submit a revised quote within the specified time slot. PREMIER ENERGIES reserves the right to cancel the inquiry and reissue it later or at a different time as necessary. Additionally, PREMIER ENERGIES may extend or modify the time period at its sole discretion for submitting quotes as needed.
3. If a quote was submitted in error, the transporter may approach PREMIER ENERGIES's Head of Logistics immediately. The logistics manager will cancel the quote based on the transporter's written request via email. However, frequent requests of this nature are not encouraged.
4. PREMIER ENERGIES will generally award the contract to the lowest bidder; however, it reserves the right to award the contract to bidders who quoted higher based on other critical business criteria. The decision of PREMIER ENERGIES in this regard is final and binding on all the bidders. No disputes in this regard shall be entertained. Additionally, PREMIER ENERGIES reserves the right to reassess the L1 bidder based on vendor performance as outlined in Clause 18.
5. The transporter is required to arrange the truck within the specified time frame communicated by PREMIER ENERGIES. In case transporter fails to do so, PREMIER ENERGIES shall have the right to impose penalty. Additionally, PREMIER ENERGIES reserves the right to engage an alternative transporter under the risk purchase clause. Any difference in freight costs incurred by PREMIER ENERGIES will be charged to the transporter who failed to provide the truck on time, in accordance with the agreed terms.
6. The Service Purchase Order will be issued by the PREMIER ENERGIES Logistics team following vehicle mobilization. The transporter must obtain prior email confirmation from the PREMIER ENERGIES Logistics team for any associated costs, including detention or unloading charges, before incurring these expenses.
7. Truck Reporting at Loading Point: Loading will be conducted on the same day, depending on the number of pending trucks. If loading cannot be completed on that day, PREMIER ENERGIES will arrange to load the materials the following day. Halting charges will not apply if the vehicle is detained at the loading point for up to 24 hours; however, detention charges as outlined in point 9 will apply beyond this period.

**Instructions to Driver**
1. Drivers and cleaners of the vehicle should strictly follow the in-premises rules and regulations of PREMIER ENERGIES/PREMIER ENERGIES’s customers, after reaching the loading point/unloading point.
2. Drivers and cleaners of the vehicle shall be medically fit and should not be in an inebriated state at all times during the transhipment.

**E-Way Bill**
1. If an e-way bill is close to expiration and the subject consignment has not yet been delivered to Customer, it is the transporter’s responsibility to extend it before it expires.
2. In case the transporter fails to do so, the cost of the goods/charges arising out of such non-compliance under the provisions of GST Act and any applicable law shall be borne by the transporter.
3. Company shall not have any liability in this regard.

... [Continue formatting the rest of the terms similarly]
        `,
      });
      // Set agreement state to true to proceed
      setHasAgreedToTerms(true);
    } catch (error) {
      console.error("Error sending terms agreement email:", error);
      alert("Failed to send agreement email. Please try again.");
    }
  };

  // Define Terms and Conditions Modal Component
  const TermsModal = () => {
    return (
      <div className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl h-5/6 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">
              TERMS AND CONDITIONS FOR DOMESTIC TRANSPORTATION SERVICES
            </h1>
            <div
              className="terms-content mb-4 p-4 border overflow-y-auto"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollTop + clientHeight >= scrollHeight - 10) {
                  setIsAcceptButtonEnabled(true);
                }
              }}
            >
              {termsAndConditionsContent.map((section, index) => (
                <div key={index} className="mb-4">
                  <h2 className="text-xl font-bold mb-2">{section.header}</h2>
                  <ol className="list-decimal list-inside">
                    {section.content.map((point, idx) => (
                      <li key={idx} className="mb-2">
                        {point}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <p className="text-center mb-4">
              You can only make a quotation if you agree with our terms and
              conditions.
            </p>
            <div className="flex justify-center">
              <button
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
                  isAcceptButtonEnabled ? "" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={handleAcceptTerms}
                disabled={!isAcceptButtonEnabled}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Conditional Rendering based on RFQ status
  if (!rfqDetails) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (rfqStatus === "initial") {
    // Render initial quote submission form
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
            {isLoading
              ? "Submitting..."
              : vendorQuote
              ? "Update Quote"
              : "Submit Quote"}
          </button>
        </form>
      </div>
    );
  } else if (rfqStatus === "evaluation") {
    // Handle Evaluation Phase
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
    // Show Terms and Conditions Modal if necessary
    if (!hasAgreedToTerms && !vendorQuote) {
      return <TermsModal />;
    }

    // Render Evaluation Phase Quote Update Form
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
  } else if (rfqStatus === "closed") {
    // Handle Closed RFQ Status
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
