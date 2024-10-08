import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  // New state variables for OTP verification
  const [otpSent, setOtpSent] = useState(false);
  const [userOtp, setUserOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const sendOtp = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    try {
      const response = await axios.post("https://petp.onrender.com/api/send-otp", {
        email,
      });
      if (response.data.success) {
        setOtpSent(true);
        alert("OTP sent to your email. Please check your inbox.");
      } else {
        alert("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("An error occurred while sending OTP. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role === "admin" && username === "admin" && password === "admin") {
      onLogin(role, username);
    } else if ((role === "vendor" || role === "factory") && !isRegistering) {
      try {
        const response = await axios.post("https://petp.onrender.com/api/login", {
          username,
          password,
          role,
        });
        if (response.data.success) {
          onLogin(role, response.data.username);
        } else {
          alert(response.data.message || "Invalid credentials");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login. Please try again.");
      }
    } else if ((role === "vendor" || role === "factory") && isRegistering) {
      if (!otpSent) {
        // Validate the form fields before sending OTP
        if (!username || !password || !email || !contactNumber) {
          alert("Please fill in all the required fields.");
          return;
        }
        if (contactNumber.length !== 10) {
          alert("Contact Number must be exactly 10 digits.");
          return;
        }
        sendOtp();
      } else {
        // OTP has been sent, verify OTP
        try {
          const response = await axios.post(
            "https://petp.onrender.com/api/verify-otp",
            {
              email,
              otp: userOtp,
            }
          );
          if (response.data.success) {
            // OTP verified, proceed to register
            try {
              const registerResponse = await axios.post(
                "https://petp.onrender.com/api/register",
                {
                  username,
                  password,
                  email,
                  contactNumber,
                  role,
                }
              );

              if (registerResponse.data.success) {
                alert(
                  "Registration successful! Your account is pending admin approval."
                );
                navigate("/registering");
              } else {
                alert("Registration failed");
              }
            } catch (error) {
              console.error("Registration error:", error);
              alert("An error occurred during registration. Please try again.");
            }
          } else {
            setOtpError("OTP is incorrect.");
          }
        } catch (error) {
          console.error("Error verifying OTP:", error);
          alert("An error occurred while verifying OTP. Please try again.");
        }
      }
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-500 to-green-600">
      <div className="flex justify-center items-center flex-grow mt-20 p-10">
        <div className="p-8 bg-white rounded-lg shadow-2xl w-full max-w-md">
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-800">
            {isRegistering ? "Create Account" : "Sign In"}
          </h2>

          <div className="flex justify-center mb-8">
            <button
              className={`px-5 py-3 mx-2 text-sm font-bold rounded-lg ${
                role === "admin"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800 opacity-80"
              }`}
              onClick={() => setRole("admin")}
            >
              Admin
            </button>

            <button
              className={`px-5 py-3 mx-2 text-sm font-bold rounded-lg ${
                role === "vendor"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800 opacity-80"
              }`}
              onClick={() => setRole("vendor")}
            >
              Vendor
            </button>

            <button
              className={`px-5 py-3 mx-2 text-sm font-bold rounded-lg ${
                role === "factory"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800 opacity-80"
              }`}
              onClick={() => setRole("factory")}
            >
              Factory
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-black">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border bg-gray-200 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-black">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border bg-gray-200 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-black"
                placeholder="Enter your password"
                required
              />
            </div>

            {isRegistering && (role === "vendor" || role === "factory") && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-black">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border bg-gray-200 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-black"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-black">
                    Contact Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-200 border border-blue-200 rounded-l-lg text-black">
                      +91
                    </span>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setContactNumber(value);
                      }}
                      className="w-full p-3 border bg-gray-200 border-blue-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-black"
                      placeholder="Enter your 10-digit phone number"
                      required
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-900 text-white rounded-lg font-semibold transition duration-200"
                  >
                    Send OTP
                  </button>
                ) : (
                  <>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-black">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={userOtp}
                        onChange={(e) => setUserOtp(e.target.value)}
                        className="w-full p-3 border bg-gray-200 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-black"
                        placeholder="Enter the OTP sent to your email"
                        required
                      />
                      {otpError && (
                        <p className="text-red-500 text-sm mt-1">{otpError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-900 text-white rounded-lg font-semibold transition duration-200"
                    >
                      Verify OTP and Register
                    </button>

                    <button
                      type="button"
                      className="w-full py-2 mt-4 text-indigo-600 hover:underline hover:text-indigo-900 text-center font-medium"
                      onClick={() => {
                        sendOtp();
                        setUserOtp("");
                        setOtpError("");
                      }}
                    >
                      Did not receive an OTP? Resend
                    </button>

                    <button
                      type="button"
                      className="w-full py-2 mt-4 text-indigo-600 hover:underline hover:text-indigo-900 text-center font-medium"
                      onClick={() => {
                        setEmail("");
                        setOtpSent(false);
                        setUserOtp("");
                        setOtpError("");
                      }}
                    >
                      Change Email
                    </button>
                  </>
                )}
              </>
            )}

            {!isRegistering && (
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-900 text-white rounded-lg font-semibold transition duration-200"
              >
                Login
              </button>
            )}

            {(role === "vendor" || role === "factory") && (
              <button
                type="button"
                className="w-full py-2 mt-4 text-indigo-600 hover:underline hover:text-indigo-900 text-center font-medium"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setOtpSent(false);
                  setUserOtp("");
                  setOtpError("");
                }}
              >
                {isRegistering
                  ? "Already have an account? Login"
                  : "Don't have an account? Register"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;