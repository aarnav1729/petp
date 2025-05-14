// QuotesChart.jsx

import React, { useEffect } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import axios from 'axios';

const QuotesChart = () => {
  useEffect(() => {
    // Create chart instance when the component mounts
    const root = am5.Root.new('chartdiv');

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelY: 'zoomXY',
        pinchZoomX: true,
        pinchZoomY: true,
      })
    );

    // Create axes with appropriate scales and labels
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: 30,
        }),
        title: am5.Label.new(root, {
          text: 'Number of Trucks',
          fontWeight: 'bold',
        }),
        min: 0,
        max: 50, // Reduced maximum value on the y-axis for better visual clarity
        strictMinMax: true,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 50,
        }),
        title: am5.Label.new(root, {
          text: 'Price (in INR)',
          fontWeight: 'bold',
        }),
        numberFormat: '#,###',
        min: 0,
        max: 250000, // Expanded maximum value on the x-axis
        strictMinMax: true,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'numberOfTrucks',
        valueXField: 'price',
        tooltip: am5.Tooltip.new(root, {
          labelText:
            'Company: {companyName}\nRFQ Number: {rfqNumber}\nPrice: {valueX.formatNumber("#,###")}\nTrucks: {valueY.formatNumber("#")}',
        }),
      })
    );

    series.strokes.template.set('visible', false);

    // Add bullet for better visual representation
    const circleTemplate = am5.Template.new({});

    series.bullets.push(() => {
      const bulletCircle = am5.Circle.new(
        root,
        {
          radius: 5,
          fill: series.get('fill'),
          fillOpacity: 0.8,
          tooltipText:
            'Vendor: {companyName}\nPrice: {valueX.formatNumber("#,###")}\nTrucks: {valueY.formatNumber("#")}',
        },
        circleTemplate
      );

      bulletCircle.states.create('hover', {
        fill: chart.get('colors').getIndex(4),
      });

      return am5.Bullet.new(root, {
        sprite: bulletCircle,
      });
    });

    // Add heat rule for better differentiation
    series.set('heatRules', [
      {
        target: circleTemplate,
        min: 5,
        max: 15,
        dataField: 'value',
        key: 'radius',
      },
    ]);

    // Fetch data from API
    axios
      .get('https://leaf-tn20.onrender.com/api/quotes')
      .then((response) => {
        // Map data to required format
        const quotesData = response.data.map((quote) => ({
          price: quote.price,
          numberOfTrucks: quote.numberOfTrucks,
          companyName: quote.vendorName, 
          rfqNumber: quote.rfqNumber,
        }));

        // Set data
        series.data.setAll(quotesData);
      })
      .catch((error) => {
        console.error('Error fetching quotes data:', error);
      });

    // Make animation appear on load
    chart.appear(1000, 100);

    return () => {
      root.dispose(); // Dispose of chart when component unmounts
    };
  }, []);

  return (
    <div>
      <div id="chartdiv" style={{ width: '100%', height: '500px' }}></div>
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '1rem' }}>
        <p>
          <strong>Insights:</strong> This chart displays the quotes and the number of trucks offered by each vendor for different RFQs. The x-axis represents the price quoted (in INR), while the y-axis shows the number of trucks each company offered. By analyzing this chart, you can quickly identify the companies offering the most competitive prices and the number of trucks they can supply, providing valuable insight into vendor competitiveness and capacity.
        </p>
      </div>
    </div>
  );
};

export default QuotesChart;