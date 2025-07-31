// MDView.jsx

import React, { useState, Suspense } from "react";
import CollapsibleSection from "./CollapsibleSection";
import "./MDView.css";
const API = "https://14.194.111.58:10443";
const TransportationCostsChart = React.lazy(() =>
  import("./TransportationCostsChart")
);
const VendorParticipationChart = React.lazy(() =>
  import("./VendorParticipationChart")
);
const SavingsAchievedChart = React.lazy(() => import("./SavingsAchievedChart"));
const TopVendorsChart = React.lazy(() => import("./TopVendorsChart"));
const GeographicalDistributionMap = React.lazy(() =>
  import("./GeographicalDistributionMap")
);
const KeyMetricsCards = React.lazy(() => import("./KeyMetricsCards"));
const QuotesChart = React.lazy(() => import("./QuotesChart"));

const VehicleTypeSplitChart = React.lazy(() =>
  import("./VehicleTypeSplitChart")
);

const MonthOverMonthVehiclesChart = React.lazy(() =>
  import("./MonthOverMonthVehiclesChart")
);

const MDView = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (sectionKey) => {
    setOpenSection((prevSection) =>
      prevSection === sectionKey ? null : sectionKey
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>LEAF Dashboard</h1>
      </header>

      <Suspense fallback={<div>Loading Key Metrics...</div>}>
        <section className="key-metrics-section">
          <KeyMetricsCards />
        </section>
      </Suspense>

      <Suspense fallback={<div>Loading Charts...</div>}>
        <div className="tiles-container">
          <CollapsibleSection
            title="Transportation Costs Analysis"
            description="Overview of transportation expenditure"
            isOpen={openSection === "transportationCosts"}
            onToggle={() => toggleSection("transportationCosts")}
          >
            <TransportationCostsChart />
          </CollapsibleSection>

          <CollapsibleSection
            title="Savings Achieved Over Time"
            description="Accumulated savings across periods"
            isOpen={openSection === "savingsAchieved"}
            onToggle={() => toggleSection("savingsAchieved")}
          >
            <SavingsAchievedChart />
          </CollapsibleSection>

          <CollapsibleSection
            title="Vehicle Type Split"
            description="Distribution of vehicle types used across RFQs"
            isOpen={openSection === "vehicleTypeSplit"}
            onToggle={() => toggleSection("vehicleTypeSplit")}
          >
            <VehicleTypeSplitChart />
          </CollapsibleSection>

          <CollapsibleSection
            title="Vendor Participation Rate"
            description="Vendors' activity overview"
            isOpen={openSection === "vendorParticipation"}
            onToggle={() => toggleSection("vendorParticipation")}
          >
            <VendorParticipationChart />
          </CollapsibleSection>

          <CollapsibleSection
            title="Month Over Month Vehicles"
            description="Total number of vehicles dispatched each month"
            isOpen={openSection === "monthOverMonthVehicles"}
            onToggle={() => toggleSection("monthOverMonthVehicles")}
          >
            <MonthOverMonthVehiclesChart />
          </CollapsibleSection>

          <CollapsibleSection
            title="Geographical Distribution of Shipments"
            description="Shipment distribution by region"
            isOpen={openSection === "geographicalDistribution"}
            onToggle={() => toggleSection("geographicalDistribution")}
          >
            <GeographicalDistributionMap />
          </CollapsibleSection>

          <CollapsibleSection
            title="Top Vendors Performance"
            description="Performance of top-performing vendors"
            isOpen={openSection === "topVendors"}
            onToggle={() => toggleSection("topVendors")}
          >
            <TopVendorsChart />
          </CollapsibleSection>

          <CollapsibleSection
            title="Quotes"
            description="Beeswarm Chart of Quotes"
            isOpen={openSection === "quotes"}
            onToggle={() => toggleSection("quotes")}
          >
            <QuotesChart />
          </CollapsibleSection>
        </div>
      </Suspense>
    </div>
  );
};

export default MDView;
