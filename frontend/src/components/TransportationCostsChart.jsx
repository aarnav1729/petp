import React, { useLayoutEffect, useRef } from 'react';
import axios from 'axios';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
const API = "https://14.194.111.58:10443";
// Apply the animated theme
am4core.useTheme(am4themes_animated);

const TransportationCostsChart = () => {
  const chartRef = useRef(null);

  useLayoutEffect(() => {
    // Create chart instance
    let chart = am4core.create('transportationCostsChartDiv', am4charts.XYChart);

    // Store chart reference
    chartRef.current = chart;

    // Fetch data from API
    axios.get(`${API}/api/md/transportation-costs`)
      .then(response => {
        console.log('Transportation Costs Data:', response.data); // Debugging line

        // Validate data format
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid data format: Expected an array');
        }

        chart.data = response.data;

        // Create date axis
        let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.minGridDistance = 50;
        dateAxis.title.text = 'Date';
        dateAxis.dateFormats.setKey("day", "MMM dd");
        dateAxis.periodChangeDateFormats.setKey("day", "MMM dd");

        // Create value axis
        let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.title.text = 'Cost (in USD)';

        // Create series for budgeted costs
        let budgetedSeries = chart.series.push(new am4charts.LineSeries());
        budgetedSeries.dataFields.valueY = 'budgetedCost';
        budgetedSeries.dataFields.dateX = 'date';
        budgetedSeries.name = 'Budgeted Cost';
        budgetedSeries.strokeWidth = 2;
        budgetedSeries.stroke = am4core.color('#FF0000');
        budgetedSeries.tooltipText = "{name}: [bold]{valueY}[/]";

        // Create series for actual costs
        let actualSeries = chart.series.push(new am4charts.LineSeries());
        actualSeries.dataFields.valueY = 'actualCost';
        actualSeries.dataFields.dateX = 'date';
        actualSeries.name = 'Actual Cost';
        actualSeries.strokeWidth = 2;
        actualSeries.stroke = am4core.color('#00FF00');
        actualSeries.tooltipText = "{name}: [bold]{valueY}[/]";

        // Add a legend
        chart.legend = new am4charts.Legend();

        // Add cursor
        chart.cursor = new am4charts.XYCursor();
      })
      .catch(error => {
        console.error('Error fetching transportation costs data:', error);
        // Optionally, display an error message in the UI
      });

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
      }
    };
  }, []);

  return (
    <div id="transportationCostsChartDiv" style={{ width: '100%', height: '500px' }}></div>
  );
};

export default TransportationCostsChart;