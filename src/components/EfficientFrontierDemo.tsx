import React, { useState, useMemo } from "react";
import EfficientFrontier from "./EfficientFrontier";
import "./EfficientFrontierDemo.css";

const EfficientFrontierDemo = () => {
  const assets = [
    { symbol: "VTI", name: "Total Stock Market", expectedReturn: 0.10, volatility: 0.16, sector: "Equity" },
    { symbol: "BND", name: "Total Bond Market", expectedReturn: 0.04, volatility: 0.05, sector: "Bonds" },
    { symbol: "VEA", name: "Developed Markets", expectedReturn: 0.08, volatility: 0.18, sector: "Equity" },
    { symbol: "VWO", name: "Emerging Markets", expectedReturn: 0.12, volatility: 0.25, sector: "Equity" },
    { symbol: "VNQ", name: "Real Estate", expectedReturn: 0.09, volatility: 0.22, sector: "REIT" }
  ];

  const [riskFreeRate, setRiskFreeRate] = useState(0.02);
  const currentPortfolio = [0.2, 0.2, 0.2, 0.2, 0.2];

  return (
    <div className="efficient-frontier-demo">
      <div className="demo-header">
        <h2>📈 Efficient Frontier Analysis</h2>
        <p>Interactive demonstration of portfolio optimization</p>
      </div>
      <EfficientFrontier
        assets={assets}
        currentPortfolio={currentPortfolio}
        riskFreeRate={riskFreeRate}
      />
    </div>
  );
};

export default EfficientFrontierDemo; 

