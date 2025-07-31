// src/components/Contact.jsx

import React, { useState } from "react";
import axios from "axios";
const API = "https://14.194.111.58:10443";
const Contact = () => {
  // State variables for form fields
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    companyName: "",
    message: "",
  });

  // State for handling form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // For contactNumber, ensure only digits are allowed
    if (name === "contactNumber") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic form validation
    const { name, contactNumber, companyName, message } = formData;
    if (!name || !contactNumber || !companyName || !message) {
      setSubmissionError("Please fill in all the required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      // Send form data to the backend API endpoint
      await axios.post(`${API}/api/contact`, formData);
      setSubmissionSuccess(true);
      setFormData({
        name: "",
        contactNumber: "",
        companyName: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmissionError(
        "An error occurred while submitting the form. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-green-500 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-chakra">
      <div className="max-w-7xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-white">
            Get in Touch with Us
          </h1>
          <p className="mt-4 text-lg text-gray-200">
            We are here to help and answer any questions you might have.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white bg-opacity-80 rounded-lg shadow-lg p-8 space-y-6">
            <h2 className="text-3xl font-bold text-indigo-600">
              Contact Information
            </h2>
            <p className="text-lg text-gray-700">
              If you have any questions or need assistance, please reach out to us:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-indigo-600">Email</h3>
                <p>
                  <a
                    href="mailto:leaf@premierenergies.com"
                    className="text-gray-800 hover:text-indigo-600"
                  >
                    leaf@premierenergies.com
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:aarnav.singh@premierenergies.com"
                    className="text-gray-800 hover:text-indigo-600"
                  >
                    aarnav.singh@premierenergies.com
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-indigo-600">Phone</h3>
                <p>
                  <a
                    href="tel:+918143025550"
                    className="text-gray-800 hover:text-indigo-600"
                  >
                    +91 81430 25550
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-indigo-600">Address</h3>
                <p className="text-gray-800">
                  Premier Energies Limited,
                  <br />
                  Sy. No. 83/1, Orbit Tower 1, 8th Floor
                  <br />
                  Knowledge City Rd, TSIIC, Hyderabad, Raidurg, Telangana - 500081
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white bg-opacity-80 rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-indigo-600 mb-6">
              Send Us a Message
            </h2>
            {submissionSuccess && (
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                Your message has been sent successfully!
              </div>
            )}
            {submissionError && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {submissionError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Contact Number *
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter your contact number"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter your company name"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter your message"
                  rows="5"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className={`w-full py-3 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition duration-200 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;