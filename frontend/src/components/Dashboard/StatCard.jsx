/**
 * Stat Card Component - Hiển thị số liệu tổng quan
 */
import React from 'react';
import { formatCurrency, formatPercentage, getPnlClass } from '../../utils/formatters';
import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  type = 'currency', 
  icon,
  trend,
  trendValue,
  colorClass 
}) => {
  const formattedValue = type === 'currency' 
    ? formatCurrency(value)
    : type === 'percentage'
    ? formatPercentage(value)
    : value;

  const valueClass = colorClass || (type === 'pnl' ? getPnlClass(value) : '');

  return (
    <div className="stat-card animate-fade-in">
      <div className="stat-card-header">
        <span className="stat-card-icon">{icon}</span>
        <span className="stat-card-title">{title}</span>
      </div>
      
      <div className="stat-card-body">
        <div className={`stat-card-value number ${valueClass}`}>
          {formattedValue}
        </div>
        
        {subtitle && (
          <div className="stat-card-subtitle">{subtitle}</div>
        )}
        
        {trend && (
          <div className={`stat-card-trend ${trend === 'up' ? 'profit' : 'loss'}`}>
            <span className="trend-icon">{trend === 'up' ? '↑' : '↓'}</span>
            <span className="trend-value number">{formatPercentage(trendValue)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
