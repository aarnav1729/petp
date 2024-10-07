import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import NewRFQForm from "./components/NewRFQForm";
import RFQList from "./components/RFQList";
import VendorList from "./components/VendorList";
import VendorRFQList from "./components/VendorRFQList";
import VendorQuoteForm from "./components/VendorQuoteForm";
import RFQDetailsPage from "./components/RFQDetailsPage";
import ActiveAuctions from "./components/ActiveAuctions";
import AuctionRoom from "./components/AuctionRoom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PendingRFQs from "./components/PendingRFQs";
import Registering from "./components/Registering";
import Accounts from "./components/Accounts";
import FactoryRFQList from "./components/FactoryRFQList";
import EvalRFQs from "./components/EvalRFQs";

const App = () => {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState("");

  const handleLogin = (userRole, user) => {
    setRole(userRole);
    setUsername(user);
  };

  const handleLogout = () => {
    setRole(null);
    setUsername("");
  };

  return (
    <Router>
      <div className="App min-h-screen bg-gradient-to-r from-blue-500 to-green-600 flex flex-col">
        <Header role={role} onLogout={handleLogout} />
        <div className="flex flex-col flex-grow">
          {!role ? (
            <Routes>
              <Route path="/" element={<Login onLogin={handleLogin} />} />
              <Route path="/registering" element={<Registering />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          ) : (
            <main className="flex-grow p-4">
              <Routes>
                <Route
                  path="/"
                  element={
                    <Navigate
                      to={
                        role === "admin"
                          ? "/rfq-list"
                          : role === "factory"
                          ? "/factory-rfq-list"
                          : "/vendor-rfq-list"
                      }
                    />
                  }
                />

                {role === "admin" && (
                  <>
                    <Route path="/rfq-list" element={<RFQList />} />
                    <Route path="/vendor-list" element={<VendorList />} />
                    <Route
                      path="/active-auctions"
                      element={<ActiveAuctions />}
                    />
                    <Route
                      path="/auction-room/:rfqId"
                      element={<AuctionRoom username={username} role={role} />}
                    />
                    <Route
                      path="/rfq/:rfqId"
                      element={<RFQDetailsPage userRole={role} />}
                    />
                    <Route path="/accounts" element={<Accounts />} />
                  </>
                )}

                {role === "vendor" && (
                  <>
                    <Route
                      path="/vendor-rfq-list"
                      element={<VendorRFQList username={username} />}
                    />
                    <Route
                      path="/vendor-quote-form/:rfqId"
                      element={<VendorQuoteForm username={username} />}
                    />
                    <Route
                      path="/pending-rfqs"
                      element={<PendingRFQs username={username} />}
                    />
                  </>
                )}

                {role === "factory" && (
                  <>
                    <Route path="/new-rfq" element={<NewRFQForm />} />
                    <Route
                      path="/factory-rfq-list"
                      element={<FactoryRFQList />}
                    />
                    <Route
                      path="/eval-rfq/:rfqId"
                      element={<EvalRFQs userRole={role} />}
                    />
                  </>
                )}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          )}
          <Footer />
        </div>
      </div>
    </Router>
  );
};

export default App;