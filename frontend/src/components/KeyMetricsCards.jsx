// KeyMetricsCards.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const KeyMetricsCards = () => {
  const [metrics, setMetrics] = useState({
    totalRFQs: 0,
    totalSavings: 0,
    averageCostPerShipment: 0,
  });

  useEffect(() => {
    axios.get('https://leaf-tn20.onrender.com/api/md/key-metrics')
      .then(response => {
        setMetrics(response.data);
      })
      .catch(error => {
        console.error('Error fetching key metrics:', error);
      });
  }, []);

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '20px',
    width: '30%',
    textAlign: 'center',
  };

  const valueStyle = {
    fontSize: '2em',
    margin: '10px 0',
  };

  return (
    <>
      <div style={cardStyle}>
        <h3>Total RFQs</h3>
        <div style={valueStyle}>{metrics.totalRFQs}</div>
      </div>
      <div style={cardStyle}>
        <h3>Total Savings Achieved</h3>
        <div style={valueStyle}>₹{metrics.totalSavings.toLocaleString()}</div>
      </div>
      <div style={cardStyle}>
        <h3>Average Cost per Shipment</h3>
        <div style={valueStyle}>₹{metrics.averageCostPerShipment.toFixed(2)}</div>
      </div>
    </>
  );
};

export default KeyMetricsCards;