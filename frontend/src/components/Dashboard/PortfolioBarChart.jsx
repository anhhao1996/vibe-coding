/**
 * Portfolio Tiết Kiệm Chart - Phân bổ tiết kiệm theo sổ
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import './Charts.css';

const SAVINGS_COLORS = ['#26a69a', '#4db6ac', '#80cbc4', '#00897b', '#009688', '#00796b', '#00695c', '#004d40'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <p className="tooltip-value">
          <span>Số dư:</span>
          <span className="number">{formatCurrency(data.value)}</span>
        </p>
        <p className="tooltip-value">
          <span>Tỷ trọng:</span>
          <span className="number">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontWeight: 600, fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PortfolioPieChart = ({ data = [] }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);

    return () => observer.disconnect();
  }, []);

  const isMobile = containerWidth < 400;
  const outerR = isMobile ? Math.min(90, containerWidth * 0.22) : 110;
  const innerR = isMobile ? outerR * 0.42 : 50;
  const chartHeight = isMobile ? 220 : 280;

  const savingsBooks = Array.isArray(data) ? data : [];

  const chartData = savingsBooks
    .filter(book => parseFloat(book.balance) > 0)
    .map((book, i) => ({
      name: book.name,
      value: parseFloat(book.balance) || 0,
      fill: book.color || SAVINGS_COLORS[i % SAVINGS_COLORS.length],
    }));

  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);
  chartData.forEach(d => { d.percentage = totalValue > 0 ? (d.value / totalValue) * 100 : 0; });

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">🏦 Portfolio Tiết Kiệm</h3>
        </div>
        <div className="chart-empty">
          <span className="empty-icon">📊</span>
          <p>Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container" ref={containerRef}>
      <div className="chart-header">
        <h3 className="chart-title">🏦 Portfolio Tiết Kiệm</h3>
        <span className="chart-summary number">{formatCurrency(totalValue)}</span>
      </div>
      <div className="chart-body pie-chart-body">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={outerR}
              innerRadius={innerR}
              dataKey="value"
              animationDuration={800}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-legend">
          {chartData.map((entry, index) => (
            <div key={index} className="pie-legend-item">
              <span
                className="pie-legend-color"
                style={{ backgroundColor: entry.fill }}
              ></span>
              <span className="pie-legend-name">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPieChart;
