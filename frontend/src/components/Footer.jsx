import React from "react";
import Logo from "../assets/pel.png";
const API = "https://14.194.111.58:10443";
const Footer = () => {
  return (
    <footer className="text-white py-8 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 text-center md:text-left mb-4">
            <img src={Logo} alt="Logo" className="h-16 mx-auto md:mx-0" />
            <p className="mt-4">
              &copy; {new Date().getFullYear()} Premier Energies Limited. 
              All rights reserved.
            </p>
          </div>
          <div className="w-full md:w-1/3 text-center md:text-right mb-4" id="contact">
            <a href="mailto:leaf@premierenergies.com" className="hover:text-black">leaf@premierenergies.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;