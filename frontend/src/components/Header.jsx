import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/it.png";

const Header = ({ role, onLogout }) => {
  const [openNav, setOpenNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks =
    role === "admin"
      ? [
          { to: "/rfq-list", label: "RFQ List" },
          { to: "/vendor-list", label: "Users" },
          { to: "/accounts", label: "Accounts" },
        ]
      : role === "vendor"
      ? [
          { to: "/vendor-rfq-list", label: "View RFQs" },
          { to: "/pending-rfqs", label: "Pending RFQs" },
        ]
      : role === "factory"
      ? [
          { to: "/new-rfq", label: "New RFQ" },
          { to: "/factory-rfq-list", label: "RFQ List" },
        ]
      : [
          { to: "/terms", label: "Terms & Conditions" },
          { to: "/contact", label: "Contact" },
        ];

  const toggleNav = () => setOpenNav(!openNav);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogoutClick = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-10 transition-all ease-in duration-3333 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <nav className="w-full">
        <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-6">
          <div
            className={`relative flex flex-wrap items-center justify-between gap-6 py-3 md:gap-0 md:py-4 ${
              scrolled ? "bg-white text-black" : "bg-transparent text-white"
            } transition-all duration-300`}
          >
            <div className="relative z-20 flex w-full justify-between md:px-0 lg:w-max">
              <Link
                to="/"
                aria-label="logo"
                className="flex items-center space-x-2"
              >
                <img
                  src={Logo}
                  alt="Logo"
                  className={`transition-all duration-300 ${
                    scrolled ? "h-12" : "h-10"
                  } md:h-12`}
                />
              </Link>

              <div className="relative flex max-h-10 items-center lg:hidden">
                <button
                  aria-label="hamburger"
                  id="hamburger"
                  className="relative -mr-6 p-6"
                  onClick={toggleNav}
                >
                  <div
                    aria-hidden="true"
                    id="line"
                    className={`m-auto h-0.5 w-5 rounded transition ease-in duration-300 ${
                      scrolled ? "bg-black" : "bg-sky-900"
                    } ${openNav ? "rotate-45 translate-y-1.5" : ""}`}
                  ></div>
                  <div
                    aria-hidden="true"
                    id="line2"
                    className={`m-auto mt-2 h-0.5 w-5 rounded transition ease-in duration-300 ${
                      scrolled ? "bg-black" : "bg-sky-900"
                    } ${openNav ? "-rotate-45 -translate-y-1" : ""}`}
                  ></div>
                </button>
              </div>
            </div>
            <div
              id="navLayer"
              aria-hidden="true"
              className={`fixed inset-0 z-10 h-screen w-screen origin-bottom scale-y-0 bg-transparent backdrop-blur-2xl transition duration-500 dark:bg-transparent lg:hidden ${
                openNav ? "scale-y-100" : ""
              }`}
            ></div>

            <div
              id="navlinks"
              className={`invisible absolute top-full left-0 z-20 w-full origin-top-right translate-y-1 scale-90 flex-col flex-wrap justify-end gap-6 rounded-3xl border border-gray-100 bg-gray-700 p-8 opacity-0 shadow-2xl shadow-gray-600/10 transition-all ease-in duration-300 dark:border-gray-700 lg:visible lg:relative lg:flex lg:w-7/12 lg:translate-y-0 lg:scale-100 lg:flex-row lg:items-center lg:gap-0 lg:border-none ${
                scrolled ? "lg:bg-transparent" : "lg:bg-transparent"
              } lg:p-0 lg:opacity-100 lg:shadow-none ${
                openNav
                  ? "!visible !scale-100 !opacity-100 !lg:translate-y-0"
                  : "dark:bg-transparent"
              }`}
            >
              <ul
                className={`flex flex-col gap-6 tracking-wide lg:flex-row lg:gap-0 lg:text-sm ${
                  scrolled ? "text-white" : "text-white"
                }`}
              >
                {navLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className={`hover:text-indigo-600 hover:bg-white p-2 rounded font-bold block transition ${
                        scrolled ? "text-black" : "text-white"
                      } hover:text-secondary md:px-4`}
                      onClick={() => setOpenNav(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-12 lg:mt-0">
                {(role || location.pathname === "/registering") && (
                  <button
                    onClick={handleLogoutClick}
                    className="text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600"
                  >
                    {role ? "Logout" : "Back to Login"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;