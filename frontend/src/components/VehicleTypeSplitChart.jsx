// VehicleTypeSplitChart.jsx

import React, { useEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import axios from "axios";

const VehicleTypeSplitChart = () => {
  useEffect(() => {
    // Create root element and set themes
    const root = am5.Root.new("vehicleTypeSplitChartDiv");
    root.setThemes([am5themes_Animated.new(root)]);

    // Create Pie Chart
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout
      })
    );

    // Create Series
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "count",                // 'count' as returned from API
        categoryField: "vehicleType",       // or whichever field you wish to group by
        tooltip: am5.Tooltip.new(root, {
          labelText: "{category}: {value} ({percentage}%)"
        })
      })
    );

    // Fetch data from the backend endpoint
    axios
      .get("http://localhost:5000/api/md/vehicle-type-details-split")
      .then((response) => {
        // The backend returns an array of objects, e.g.:
        // [
        //    {
        //       "vehicleType": "Trailer",
        //       "additionalVehicleDetails": "XL",
        //       "count": 10,
        //       "percentage": "25.00"
        //    },
        //    ...
        // ]
        series.data.setAll(response.data);
      })
      .catch((error) => {
        console.error("Error fetching vehicle type split data:", error);
      });

    // Optional label / slice settings
    series.labels.template.setAll({
      text: "{category}:\n[bold]{value} ({percentage}%)"
    });

    // Animate on load
    series.appear(1000, 100);

    // Cleanup on unmount
    return () => {
      root.dispose();
    };
  }, []);

  return (
    <div>
      <div
        id="vehicleTypeSplitChartDiv"
        style={{ width: "100%", height: "500px" }}
      />
      <div style={{ textAlign: "center", marginTop: "20px", fontSize: "1rem" }}>
        <p>
          <strong>Insights:</strong> This chart displays the distribution of
          vehicle types (and additional details if desired) among all RFQs. Each
          slice represents the proportion of that specific vehicle type in
          relation to the total.
        </p>
      </div>
    </div>
  );
};

export default VehicleTypeSplitChart;