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
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import { formatCurrency, shortenNumber, formatDate } from '../../utils/formatters';
import './Charts.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Lọc bỏ các entry không có name hoặc name là "value" (từ Area)
    const filteredPayload = payload.filter(entry => 
      entry.name && entry.name !== 'value'
    );
    
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{formatDate(label)}</p>
        {filteredPayload.map((entry, index) => (
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
    const totalValue = parseFloat(item.total_value) || 0;
    const totalSold = parseFloat(item.total_sold) || 0;
    const savings = parseFloat(item.savings_balance) || 0;
    return {
      date: item.snapshot_date,
      // Giá trị = Đầu tư (giá trị + đã bán) + tiết kiệm tại ngày snapshot
      value: totalValue + totalSold + savings,
      invested: parseFloat(item.total_invested) || 0,
      pnl: parseFloat(item.total_pnl) || 0
    };
  });

  return (
    <div className="chart-container chart-large">
      <div className="chart-header">
        <h3 className="chart-title">📈 Biến thiên tài sản ({days} ngày)</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color" style={{ background: 'var(--primary-500)' }}></span>
            Đầu tư + Tiết kiệm
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ background: '#1976D2' }}></span>
            Đầu tư
          </span>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
            <Area 
              type="monotone"
              dataKey="value"
              stroke="var(--primary-500)"
              fill="url(#colorValue)"
              strokeWidth={0}
              tooltipType="none"
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              name="Tổng giá trị"
              stroke="var(--primary-500)" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: 'var(--primary-500)', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="invested" 
              name="Đầu tư"
              stroke="#1976D2" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioLineChart;
