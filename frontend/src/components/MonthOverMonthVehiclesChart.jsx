// MonthOverMonthVehiclesChart.jsx

import React, { useEffect } from "react";
import axios from "axios";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const MonthOverMonthVehiclesChart = () => {
  useEffect(() => {
    // Create root
    const root = am5.Root.new("monthOverMonthVehiclesChartDiv");

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panY: false,
        layout: root.verticalLayout,
      })
    );

    // Create X-axis (category axis for months)
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "month",
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 20 }),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    xAxis.get("renderer").labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
      paddingRight: 15,
    });

    // Create Y-axis (value axis for number of vehicles)
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Vehicles",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "vehicles",
        categoryXField: "month",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{categoryX}: {valueY}",
        }),
      })
    );

    // Add simple column styling
    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0,
    });

    series.columns.template.adapters.add("fill", (fill, target) => {
      return chart.get("colors").getIndex(target.dataItem.index);
    });

    // Fetch data
    axios
      .get("http://localhost:5000/api/md/monthly-vehicles")
      .then((response) => {
        // response.data should be an array of objects, e.g.:
        // [ { month: 'Jan 2024', vehicles: 30 }, { month: 'Feb 2024', vehicles: 12 } ... ]

        const chartData = response.data || [];
        xAxis.data.setAll(chartData);
        series.data.setAll(chartData);
      })
      .catch((error) => {
        console.error("Error fetching monthly vehicles data:", error);
      });

    // Animate on load
    series.appear(1000);
    chart.appear(1000, 100);

    // Cleanup on unmount
    return () => {
      root.dispose();
    };
  }, []);

  return (
    <div>
      <div
        id="monthOverMonthVehiclesChartDiv"
        style={{ width: "100%", height: "500px" }}
      />
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p>
          <strong>Insights:</strong> This chart shows how many vehicles were
          dispatched month over month based on the <em>RFQ.createdAt</em> date.
          It helps identify seasonal trends and dispatch volume changes.
        </p>
      </div>
    </div>
  );
};

export default MonthOverMonthVehiclesChart;
