// SavingsAchievedChart.jsx

import React, { useLayoutEffect, useRef } from 'react';
import axios from 'axios';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

const SavingsAchievedChart = () => {
  const chartRef = useRef(null);

  useLayoutEffect(() => {
    let chart = am4core.create('savingsAchievedChartDiv', am4charts.XYChart);
    chartRef.current = chart;

    axios.get('http://localhost:5000/api/md/savings-achieved')
      .then(response => {
        console.log('Savings Achieved Data:', response.data);

        // Validate data format
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid data format: Expected an array');
        }

        // Parse dates
        const chartData = response.data.map(item => ({
          date: new Date(item.date),
          savings: item.savings,
        }));

        chart.data = chartData;

        // Create date axis
        let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.minGridDistance = 50;
        dateAxis.title.text = 'Date';

        // Create value axis
        let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.title.text = 'Savings (in USD)';

        // Create series
        let series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = 'savings';
        series.dataFields.dateX = 'date';
        series.name = 'Savings';
        series.columns.template.fill = am4core.color('#FFD700');
        series.tooltipText = "{name}: [bold]{valueY}[/]";

        // Add a legend
        chart.legend = new am4charts.Legend();

        // Add cursor
        chart.cursor = new am4charts.XYCursor();
      })
      .catch(error => {
        console.error('Error fetching savings achieved data:', error);
      });

    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
      }
    };
  }, []);

  return (
    <div id="savingsAchievedChartDiv" style={{ width: '100%', height: '500px' }}></div>
  );
};

export default SavingsAchievedChart;