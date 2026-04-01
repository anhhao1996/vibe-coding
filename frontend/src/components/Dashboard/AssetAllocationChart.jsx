/**
 * Asset Allocation Chart - Portfolio Đầu Tư (investments only)
 */
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import './Charts.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">
          <span className="tooltip-type-badge" style={{ background: data.fill }}></span>
          {data.name}
        </p>
        <p className="tooltip-value">
          <span>Giá trị:</span>
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
      x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontWeight: 600, fontSize: '12px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="pie-legend">
    {payload.map((entry, index) => (
      <div key={index} className="pie-legend-item">
        <span className="pie-legend-color" style={{ backgroundColor: entry.color }}></span>
        <span className="pie-legend-name">{entry.value}</span>
      </div>
    ))}
  </div>
);

const AssetAllocationChart = ({ investments = [] }) => {
  const chartData = investments
    .filter(item => parseFloat(item.value || item.current_value) > 0)
    .map(item => ({
      name: item.category_name || item.name,
      value: parseFloat(item.value || item.current_value) || 0,
      fill: item.color || '#66BB6A',
    }));

  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);
  chartData.forEach(d => { d.percentage = totalValue > 0 ? (d.value / totalValue) * 100 : 0; });

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">📈 Portfolio Đầu Tư</h3>
        </div>
        <div className="chart-empty">
          <span className="empty-icon">📊</span>
          <p>Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">📈 Portfolio Đầu Tư</h3>
        <span className="chart-summary number">{formatCurrency(totalValue)}</span>
      </div>
      <div className="chart-body pie-chart-body">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={110}
              innerRadius={50}
              dataKey="value"
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssetAllocationChart;
