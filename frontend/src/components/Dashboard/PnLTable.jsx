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
      <div className="pnl-table-body">
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
    </div>
  );
};

export default PnLTable;
