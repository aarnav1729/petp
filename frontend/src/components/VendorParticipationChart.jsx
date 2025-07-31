import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import axios from 'axios';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
const API = "https://14.194.111.58:10443";
am4core.useTheme(am4themes_animated);

const VendorParticipationChart = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('all');
  const chartRef = useRef(null);

  // Fetch all vendors for the filter dropdown
  useEffect(() => {
    axios.get(`${API}/api/md/vendors`)
      .then(response => {
        setVendors(response.data);
      })
      .catch(error => {
        console.error('Error fetching vendor list:', error);
      });
  }, []);

  useLayoutEffect(() => {
    // Dispose of the previous chart instance to avoid duplication issues
    if (chartRef.current) {
      chartRef.current.dispose();
    }

    let chart = am4core.create('vendorParticipationChartDiv', am4charts.PieChart);
    chartRef.current = chart;

    // Function to load data based on selected vendor
    const loadChartData = () => {
      let url = `${API}/api/md/vendor-participation`;
      if (selectedVendor !== 'all') {
        url += `?vendorName=${selectedVendor}`;
      }

      axios.get(url)
        .then(response => {
          console.log('Vendor Participation Data:', response.data); // Debugging line

          // Validate data format
          if (Array.isArray(response.data) && response.data.length > 0) {
            chart.data = response.data;

            let pieSeries = chart.series.push(new am4charts.PieSeries());
            pieSeries.dataFields.value = 'count';
            pieSeries.dataFields.category = 'status';
            pieSeries.slices.template.tooltipText = "{category}: [bold]{value}[/]";
            pieSeries.colors.step = 2;

            chart.innerRadius = am4core.percent(40);

            // Add legend
            chart.legend = new am4charts.Legend();
          } else {
            console.error('No valid data to display.');
            chart.data = [
              { status: "No Data Available", count: 1 }
            ];
          }
        })
        .catch(error => {
          console.error('Error fetching vendor participation data:', error);
          chart.data = [
            { status: "Error Fetching Data", count: 1 }
          ];
        });
    };

    // Load data initially and when selectedVendor changes
    loadChartData();

    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
      }
    };
  }, [selectedVendor]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="vendorSelect">Select Vendor: </label>
        <select
          id="vendorSelect"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
        >
          <option value="all">All Vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor} value={vendor}>{vendor}</option>
          ))}
        </select>
      </div>
      <div id="vendorParticipationChartDiv" style={{ width: '100%', height: '500px' }}></div>
    </div>
  );
};

export default VendorParticipationChart;