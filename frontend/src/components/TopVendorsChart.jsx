// TopVendorsChart.jsx

import React, { useLayoutEffect, useRef } from 'react';
import axios from 'axios';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

const TopVendorsChart = () => {
  const chartRef = useRef(null);

  useLayoutEffect(() => {
    let chart = am4core.create('topVendorsChartDiv', am4charts.XYChart);
    chartRef.current = chart;

    axios.get('https://leaf-tn20.onrender.com/api/md/top-vendors')
      .then(response => {
        console.log('Top Vendors Data:', response.data);

        chart.data = response.data;

        // Create category axis
        let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.dataFields.category = 'vendorName';
        categoryAxis.title.text = 'Vendor';
        categoryAxis.renderer.labels.template.fill = am4core.color("#FFFFFF");

        // Create value axis
        let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.title.text = 'Total Trucks Allotted';
        valueAxis.renderer.labels.template.fill = am4core.color("#FFFFFF");

        // Create series
        let series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = 'totalTrucksAllotted';
        series.dataFields.categoryX = 'vendorName';
        series.name = 'Total Trucks Allotted';
        series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
        series.columns.template.fill = am4core.color('#FFD700'); // Gold color

        // Customize columns
        series.columns.template.strokeWidth = 0;

        // Add cursor
        chart.cursor = new am4charts.XYCursor();

        // Set background to transparent
        chart.background.fill = am4core.color("transparent");

        // Set chart colors
        chart.colors.list = [am4core.color('#FFD700')]; // Gold color
      })
      .catch(error => {
        console.error('Error fetching top vendors data:', error);
      });

    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
      }
    };
  }, []);

  return (
    <div id="topVendorsChartDiv" style={{ width: '100%', height: '500px' }}></div>
  );
};

export default TopVendorsChart;
