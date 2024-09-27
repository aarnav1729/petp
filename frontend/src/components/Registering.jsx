import React from "react";

const Registering = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-500 to-green-600">
      <div className="flex justify-center items-center flex-grow mt-20 p-10">
        <div className="p-8 bg-white rounded-lg shadow-2xl w-full max-w-md text-center">
          <h2 className="mb-8 text-3xl font-bold text-gray-800">
            Registration Successful!
          </h2>
          <p className="text-xl text-gray-700">
            Your account is pending admin approval.
          </p>
          <p className="mt-4 text-gray-600">
            You will receive an email notification once your account is approved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registering;