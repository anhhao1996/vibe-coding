/**
 * Net Worth Card - Hiển thị tổng tài sản nổi bật
 */
import React from 'react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './NetWorthCard.css';

const NetWorthCard = ({ investmentValue = 0, savingsBalance = 0, investmentPnl = 0, savingsInterest = 0 }) => {
  const totalNetWorth = investmentValue + savingsBalance;
  const totalGain = investmentPnl + savingsInterest;
  const isPositive = totalGain >= 0;
  const gainPercentage = totalNetWorth > 0 ? (totalGain / (totalNetWorth - totalGain)) * 100 : 0;

  return (
    <div className="net-worth-card animate-fade-in">
      <div className="net-worth-main">
        <div className="net-worth-label">
          <span className="net-worth-icon">🏛️</span>
          <span>TỔNG TÀI SẢN</span>
        </div>
        <div className="net-worth-value number">{formatCurrency(totalNetWorth)}</div>
        <div className={`net-worth-gain ${isPositive ? 'positive' : 'negative'}`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span className="number">{formatCurrency(Math.abs(totalGain))}</span>
          <span className="gain-percent number">({formatPercentage(gainPercentage)})</span>
          <span className="gain-label">tổng lời/lỗ</span>
        </div>
      </div>
      <div className="net-worth-breakdown">
        <div className="breakdown-item">
          <div className="breakdown-header">
            <span className="breakdown-dot investment"></span>
            <span className="breakdown-label">Đầu tư</span>
          </div>
          <div className="breakdown-value number">{formatCurrency(investmentValue)}</div>
          <div className="breakdown-sub">
            {totalNetWorth > 0 && (
              <span className="breakdown-percent number">
                {((investmentValue / totalNetWorth) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="breakdown-divider"></div>
        <div className="breakdown-item">
          <div className="breakdown-header">
            <span className="breakdown-dot savings"></span>
            <span className="breakdown-label">Tiết kiệm</span>
          </div>
          <div className="breakdown-value number">{formatCurrency(savingsBalance)}</div>
          <div className="breakdown-sub">
            {totalNetWorth > 0 && (
              <span className="breakdown-percent number">
                {((savingsBalance / totalNetWorth) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthCard;
