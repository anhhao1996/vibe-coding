/**
 * Savings Table Component - Tổng quan nhanh các sổ tiết kiệm
 */
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import './SavingsTable.css';

const SavingsTable = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="savings-table-container">
        <div className="savings-table-header">
          <h3 className="savings-table-title">🏦 Tổng quan Tiết kiệm</h3>
        </div>
        <div className="empty-state">
          <span className="empty-icon">🏦</span>
          <p>Chưa có sổ tiết kiệm nào</p>
        </div>
      </div>
    );
  }

  const totalBalance = data.reduce((sum, b) => sum + parseFloat(b.balance || 0), 0);
  const totalDeposited = data.reduce((sum, b) => sum + parseFloat(b.total_deposited || 0), 0);
  const totalInterest = data.reduce((sum, b) => sum + parseFloat(b.total_interest || 0), 0);
  const totalWithdrawn = data.reduce((sum, b) => sum + parseFloat(b.total_withdrawn || 0), 0);

  return (
    <div className="savings-table-container">
      <div className="savings-table-header">
        <h3 className="savings-table-title">🏦 Tổng quan Tiết kiệm</h3>
        <span className="savings-table-total number">{formatCurrency(totalBalance)}</span>
      </div>

      {/* Desktop Table */}
      <div className="savings-table-body savings-desktop">
        <table className="savings-overview-table">
          <thead>
            <tr>
              <th>Sổ tiết kiệm</th>
              <th className="text-right">Đã nạp</th>
              <th className="text-right">Lãi nhận</th>
              <th className="text-right">Đã rút</th>
              <th className="text-right">Số dư</th>
            </tr>
          </thead>
          <tbody>
            {data.map((book, index) => (
              <tr key={book.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <td>
                  <div className="savings-name-cell">
                    <span className="savings-dot" style={{ backgroundColor: book.color || '#2196F3' }}></span>
                    <span className="savings-book-name">{book.name}</span>
                  </div>
                </td>
                <td className="text-right number">{formatCurrency(book.total_deposited)}</td>
                <td className="text-right number savings-interest">{formatCurrency(book.total_interest)}</td>
                <td className="text-right number savings-withdrawn">{formatCurrency(book.total_withdrawn)}</td>
                <td className="text-right number savings-balance-val">{formatCurrency(book.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="savings-total-row">
              <td><strong>TỔNG CỘNG</strong></td>
              <td className="text-right number"><strong>{formatCurrency(totalDeposited)}</strong></td>
              <td className="text-right number savings-interest"><strong>{formatCurrency(totalInterest)}</strong></td>
              <td className="text-right number savings-withdrawn"><strong>{formatCurrency(totalWithdrawn)}</strong></td>
              <td className="text-right number savings-balance-val"><strong>{formatCurrency(totalBalance)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="savings-mobile">
        {data.map((book, index) => (
          <div
            key={book.id}
            className="savings-card-item animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="savings-card-item-top">
              <div className="savings-card-item-name">
                <span className="savings-dot" style={{ backgroundColor: book.color || '#2196F3' }}></span>
                <span>{book.name}</span>
              </div>
              <span className="number savings-balance-val">{formatCurrency(book.balance)}</span>
            </div>
            <div className="savings-card-item-numbers">
              <div className="savings-card-item-col">
                <span className="savings-card-item-label">Đã nạp</span>
                <span className="number">{formatCurrency(book.total_deposited)}</span>
              </div>
              <div className="savings-card-item-col">
                <span className="savings-card-item-label">Lãi nhận</span>
                <span className="number savings-interest">{formatCurrency(book.total_interest)}</span>
              </div>
              <div className="savings-card-item-col">
                <span className="savings-card-item-label">Đã rút</span>
                <span className="number savings-withdrawn">{formatCurrency(book.total_withdrawn)}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="savings-card-item savings-card-item-total">
          <div className="savings-card-item-top">
            <div className="savings-card-item-name">
              <strong>TỔNG CỘNG</strong>
            </div>
            <strong className="number savings-balance-val">{formatCurrency(totalBalance)}</strong>
          </div>
          <div className="savings-card-item-numbers">
            <div className="savings-card-item-col">
              <span className="savings-card-item-label">Đã nạp</span>
              <strong className="number">{formatCurrency(totalDeposited)}</strong>
            </div>
            <div className="savings-card-item-col">
              <span className="savings-card-item-label">Lãi nhận</span>
              <strong className="number savings-interest">{formatCurrency(totalInterest)}</strong>
            </div>
            <div className="savings-card-item-col">
              <span className="savings-card-item-label">Đã rút</span>
              <strong className="number savings-withdrawn">{formatCurrency(totalWithdrawn)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsTable;
