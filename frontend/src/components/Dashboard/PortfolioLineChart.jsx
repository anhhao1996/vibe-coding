/**
 * Portfolio Line Chart Component - Hiển thị biến thiên portfolio theo thời gian
 */
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency, shortenNumber, formatDate } from '../../utils/formatters';
import './Charts.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{formatDate(label)}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-value" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span className="number">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PortfolioLineChart = ({ data = [], days = 30 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container chart-large">
        <div className="chart-header">
          <h3 className="chart-title">Biến thiên tài sản ({days} ngày)</h3>
        </div>
        <div className="chart-empty">
          <span className="empty-icon">📈</span>
          <p>Chưa có dữ liệu lịch sử</p>
        </div>
      </div>
    );
  }

  const chartData = data.map(item => {
    const totalInvested = parseFloat(item.total_invested) || 0;
    const savingsDeposited = parseFloat(item.savings_deposited) || 0;
    const totalValue = parseFloat(item.total_value) || 0;
    const savingsBalance = parseFloat(item.savings_balance) || 0;
    return {
      date: item.snapshot_date,
      // Tổng tiền đã nạp = Tổng đầu tư + Tổng đã nạp (tiết kiệm)
      totalDeposited: totalInvested + savingsDeposited,
      // Giá trị hiện tại = Giá trị hiện tại (đầu tư) + Tổng số dư (tiết kiệm)
      currentValue: totalValue + savingsBalance
    };
  });

  return (
    <div className="chart-container chart-large">
      <div className="chart-header">
        <h3 className="chart-title">📈 Biến thiên tài sản ({days} ngày)</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color" style={{ background: '#1976D2' }}></span>
            Tổng tiền đã nạp
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ background: 'var(--primary-500)' }}></span>
            Giá trị hiện tại
          </span>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--border-light)"
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-light)' }}
              tickFormatter={(date) => formatDate(date)}
            />
            <YAxis 
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={shortenNumber}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="totalDeposited" 
              name="Tổng tiền đã nạp"
              stroke="#1976D2" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#1976D2', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="currentValue" 
              name="Giá trị hiện tại"
              stroke="var(--primary-500)" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: 'var(--primary-500)', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioLineChart;
