/**
 * PnL Last 7 Days - Lãi/lỗ đầu tư + lãi đã nhận tiết kiệm (tại mỗi ngày snapshot)
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { formatCurrency, formatDate, shortenNumber } from '../../utils/formatters';
import './Charts.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const row = payload[0].payload;
    const value = payload[0].value;
    const inv = row?.investmentPnl ?? 0;
    const sav = row?.savingsInterest ?? 0;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{formatDate(label)}</p>
        <p className={`tooltip-value ${value >= 0 ? 'profit' : 'loss'}`}>
          <span>Lãi/Lỗ (tổng):</span>
          <span className="number">{formatCurrency(value)}</span>
        </p>
        <p className="tooltip-value" style={{ opacity: 0.85 }}>
          <span>Đầu tư:</span>
          <span className="number">{formatCurrency(inv)}</span>
        </p>
        <p className="tooltip-value" style={{ opacity: 0.85 }}>
          <span>Lãi tiết kiệm:</span>
          <span className="number">{formatCurrency(sav)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const PnL7Days = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">PnL 7 ngày gần nhất</h3>
        </div>
        <div className="chart-empty">
          <span className="empty-icon">💹</span>
          <p>Chưa có dữ liệu PnL</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => {
    const daily = parseFloat(item.daily_pnl) || 0;
    const hasSplit = item.investment_pnl != null && item.investment_pnl !== '';
    const inv = hasSplit ? parseFloat(item.investment_pnl) || 0 : daily;
    const sav = hasSplit ? parseFloat(item.savings_interest) || 0 : 0;
    return {
      date: item.snapshot_date,
      pnl: daily,
      investmentPnl: inv,
      savingsInterest: sav
    };
  });

  const totalPnl = chartData.length >= 2
    ? chartData[chartData.length - 1].pnl - chartData[0].pnl
    : (chartData[0]?.pnl || 0);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">💹 PnL 7 ngày gần nhất</h3>
        <div className={`chart-summary number ${totalPnl >= 0 ? 'profit' : 'loss'}`}>
          {formatCurrency(totalPnl)}
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            barSize={30}
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
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis 
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={shortenNumber}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <ReferenceLine y={0} stroke="var(--neutral-400)" strokeWidth={1} />
            <Bar 
              dataKey="pnl" 
              radius={[4, 4, 0, 0]}
              animationDuration={600}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.pnl >= 0 ? 'var(--success)' : 'var(--error)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PnL7Days;
