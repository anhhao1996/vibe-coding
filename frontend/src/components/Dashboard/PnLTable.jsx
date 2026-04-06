/**
 * PnL Table Component - Chi tiết lời lỗ từng khoản đầu tư
 */
import React from 'react';
import { formatCurrency, formatPercentage, getPnlClass } from '../../utils/formatters';
import './PnLTable.css';

const PnLTable = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="pnl-table-container">
        <div className="pnl-table-header">
          <h3 className="pnl-table-title">📋 Chi tiết Lời/Lỗ</h3>
        </div>
        <div className="empty-state">
          <span className="empty-icon">📑</span>
          <p>Chưa có dữ liệu đầu tư</p>
        </div>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => 
    Math.abs(parseFloat(b.pnl) || 0) - Math.abs(parseFloat(a.pnl) || 0)
  );

  const totalInvested = data.reduce((sum, item) => sum + (parseFloat(item.total_invested) || 0), 0);
  const totalValue = data.reduce((sum, item) => sum + (parseFloat(item.current_value) || 0), 0);
  const totalPnl = data.reduce((sum, item) => sum + (parseFloat(item.pnl) || 0), 0);
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalPnlClass = getPnlClass(totalPnl);

  return (
    <div className="pnl-table-container">
      <div className="pnl-table-header">
        <h3 className="pnl-table-title">📋 Chi tiết Lời/Lỗ</h3>
        <span className="pnl-table-total number">{formatCurrency(totalValue)}</span>
      </div>

      {/* Desktop Table */}
      <div className="pnl-table-body pnl-desktop">
        <table className="pnl-table">
          <thead>
            <tr>
              <th>Danh mục</th>
              <th className="text-right">Đầu tư</th>
              <th className="text-right">Giá trị</th>
              <th className="text-right">Lãi/Lỗ</th>
              <th className="text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => {
              const pnl = parseFloat(item.pnl) || 0;
              const pnlPercentage = parseFloat(item.pnl_percentage) || 0;
              const pnlClass = getPnlClass(pnl);

              return (
                <tr 
                  key={item.category_id || index}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td>
                    <div className="category-cell">
                      <span 
                        className="category-color" 
                        style={{ backgroundColor: item.color || 'var(--primary-500)' }}
                      ></span>
                      <span className="category-name">{item.category_name}</span>
                    </div>
                  </td>
                  <td className="text-right number">
                    {formatCurrency(item.total_invested)}
                  </td>
                  <td className="text-right number">
                    {formatCurrency(item.current_value)}
                  </td>
                  <td className={`text-right number ${pnlClass}`}>
                    {formatCurrency(pnl)}
                  </td>
                  <td className={`text-right ${pnlClass}`}>
                    <span className={`pnl-badge ${pnlClass}`}>
                      {formatPercentage(pnlPercentage)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="pnl-total-row">
              <td><strong>TỔNG CỘNG</strong></td>
              <td className="text-right number"><strong>{formatCurrency(totalInvested)}</strong></td>
              <td className="text-right number"><strong>{formatCurrency(totalValue)}</strong></td>
              <td className={`text-right number ${totalPnlClass}`}><strong>{formatCurrency(totalPnl)}</strong></td>
              <td className={`text-right ${totalPnlClass}`}>
                <span className={`pnl-badge ${totalPnlClass}`}>
                  {formatPercentage(totalPnlPct)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="pnl-mobile">
        {sortedData.map((item, index) => {
          const pnl = parseFloat(item.pnl) || 0;
          const pnlPercentage = parseFloat(item.pnl_percentage) || 0;
          const pnlClass = getPnlClass(pnl);

          return (
            <div
              key={item.category_id || index}
              className="pnl-card animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="pnl-card-top">
                <div className="pnl-card-name">
                  <span
                    className="category-color"
                    style={{ backgroundColor: item.color || 'var(--primary-500)' }}
                  ></span>
                  <span>{item.category_name}</span>
                </div>
                <span className={`pnl-badge ${pnlClass}`}>
                  {formatPercentage(pnlPercentage)}
                </span>
              </div>
              <div className="pnl-card-numbers">
                <div className="pnl-card-col">
                  <span className="pnl-card-label">Đầu tư</span>
                  <span className="number">{formatCurrency(item.total_invested)}</span>
                </div>
                <div className="pnl-card-col">
                  <span className="pnl-card-label">Giá trị</span>
                  <span className="number">{formatCurrency(item.current_value)}</span>
                </div>
                <div className="pnl-card-col">
                  <span className="pnl-card-label">Lãi/Lỗ</span>
                  <span className={`number ${pnlClass}`}>{formatCurrency(pnl)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="pnl-card pnl-card-total">
          <div className="pnl-card-top">
            <div className="pnl-card-name">
              <strong>TỔNG CỘNG</strong>
            </div>
            <span className={`pnl-badge ${totalPnlClass}`}>
              {formatPercentage(totalPnlPct)}
            </span>
          </div>
          <div className="pnl-card-numbers">
            <div className="pnl-card-col">
              <span className="pnl-card-label">Đầu tư</span>
              <strong className="number">{formatCurrency(totalInvested)}</strong>
            </div>
            <div className="pnl-card-col">
              <span className="pnl-card-label">Giá trị</span>
              <strong className="number">{formatCurrency(totalValue)}</strong>
            </div>
            <div className="pnl-card-col">
              <span className="pnl-card-label">Lãi/Lỗ</span>
              <strong className={`number ${totalPnlClass}`}>{formatCurrency(totalPnl)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PnLTable;
