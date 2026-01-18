/**
 * Transactions Page - Danh sách giao dịch
 */
import React, { useState, useEffect, useCallback } from 'react';
import { TransactionForm, Modal } from '../../components/Form';
import { transactionApi, categoryApi } from '../../services/api';
import { formatCurrency, formatDate, formatQuantity } from '../../utils/formatters';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [transRes, catRes] = await Promise.all([
        transactionApi.getAll(100),
        categoryApi.getAll()
      ]);
      setTransactions(transRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTransaction = async (data) => {
    setSubmitting(true);
    try {
      await transactionApi.create(data);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTransaction = async (data) => {
    setSubmitting(true);
    try {
      await transactionApi.update(editingTransaction.id, data);
      setShowModal(false);
      setEditingTransaction(null);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      return;
    }
    try {
      await transactionApi.delete(id);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  const openDetailModal = (transaction) => {
    setViewingTransaction(transaction);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setViewingTransaction(null);
  };

  // Lọc giao dịch theo tất cả các filter
  const filteredTransactions = transactions.filter(t => {
    // Filter theo loại (buy/sell/all)
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    
    // Filter theo danh mục
    if (categoryFilter !== 'all' && t.category_id !== parseInt(categoryFilter)) return false;
    
    // Filter theo ngày
    const transDate = new Date(t.transaction_date).toISOString().split('T')[0];
    if (dateFrom && transDate < dateFrom) return false;
    if (dateTo && transDate > dateTo) return false;
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, dateFrom, dateTo, itemsPerPage]);

  // Reset filters
  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo;

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="transactions-page">
        <div className="page-header">
          <h1 className="page-title">📝 Lịch sử Giao dịch</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Lịch sử Giao dịch</h1>
          <p className="page-subtitle">Tất cả các giao dịch mua bán của bạn</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          ➕ Thêm giao dịch
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-secondary" onClick={fetchData}>
            Thử lại
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        {/* Filter Header Row */}
        <div className="filter-header">
          {/* Type Filter Tabs */}
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              Tất cả ({transactions.length})
            </button>
            <button 
              className={`filter-tab buy ${typeFilter === 'buy' ? 'active' : ''}`}
              onClick={() => setTypeFilter('buy')}
            >
              🟢 Mua ({transactions.filter(t => t.type === 'buy').length})
            </button>
            <button 
              className={`filter-tab sell ${typeFilter === 'sell' ? 'active' : ''}`}
              onClick={() => setTypeFilter('sell')}
            >
              🔴 Bán ({transactions.filter(t => t.type === 'sell').length})
            </button>
          </div>

          {/* Filter Toggle Button */}
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="filter-icon">🔍</span>
            Bộ lọc
            {hasActiveFilters && <span className="filter-badge">●</span>}
            <span className={`filter-arrow ${showFilters ? 'open' : ''}`}>▼</span>
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        <div className={`filter-panel ${showFilters ? 'open' : ''}`}>
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">📁 Danh mục</label>
              <select 
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">📅 Từ ngày</label>
              <input
                type="date"
                className="filter-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">📅 Đến ngày</label>
              <input
                type="date"
                className="filter-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <button className="btn btn-outline btn-sm filter-clear" onClick={clearFilters}>
                ✕ Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Results count & Items per page */}
        <div className="filter-footer">
          <div className="filter-results">
            Hiển thị <strong>{startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)}</strong> / {filteredTransactions.length} giao dịch
          </div>
          <div className="items-per-page">
            <span>Hiển thị:</span>
            <select 
              className="items-select"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>/ trang</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-container">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>Chưa có giao dịch nào</h3>
            <p>Bắt đầu theo dõi đầu tư bằng cách thêm giao dịch đầu tiên</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              ➕ Thêm giao dịch
            </button>
          </div>
        ) : (
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Danh mục</th>
                  <th>Loại</th>
                  <th className="text-right">Số lượng</th>
                  <th className="text-right">Giá</th>
                  <th className="text-right">Tổng</th>
                  <th>Ghi chú</th>
                  <th style={{ width: '180px', minWidth: '180px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction, index) => (
                  <tr 
                    key={transaction.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="date-cell">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td>
                      <div className="category-cell">
                        <span 
                          className="category-dot"
                          style={{ backgroundColor: transaction.category_color }}
                        ></span>
                        {transaction.category_name}
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${transaction.type}`}>
                        {transaction.type === 'buy' ? '🟢 Mua' : '🔴 Bán'}
                      </span>
                    </td>
                    <td className="text-right number">
                      {formatQuantity(transaction.quantity)}
                    </td>
                    <td className="text-right number">
                      {formatCurrency(transaction.price)}
                    </td>
                    <td className={`text-right number ${transaction.type === 'buy' ? 'loss' : 'profit'}`}>
                      {transaction.type === 'buy' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="notes-cell">
                      {transaction.notes || '-'}
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button 
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: '#e3f2fd',
                            color: '#1976d2',
                            border: '1px solid #90caf9'
                          }}
                          onClick={() => openDetailModal(transaction)}
                          title="Xem chi tiết"
                        >
                          Xem
                        </button>
                        <button 
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: '#fff8e1',
                            color: '#f57c00',
                            border: '1px solid #ffcc80'
                          }}
                          onClick={() => openEditModal(transaction)}
                          title="Sửa"
                        >
                          Sửa
                        </button>
                        <button 
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: '#ffebee',
                            color: '#d32f2f',
                            border: '1px solid #ef9a9a'
                          }}
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          title="Xóa"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              title="Trang đầu"
            >
              ««
            </button>
            <button 
              className="pagination-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              title="Trang trước"
            >
              «
            </button>
            
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
              ) : (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              )
            ))}
            
            <button 
              className="pagination-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Trang sau"
            >
              »
            </button>
            <button 
              className="pagination-btn"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Trang cuối"
            >
              »»
            </button>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTransaction ? '✏️ Sửa giao dịch' : '➕ Thêm giao dịch mới'}
      >
        <TransactionForm
          categories={categories}
          initialData={editingTransaction}
          onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
          onCancel={closeModal}
          isLoading={submitting}
        />
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        title="📋 Chi tiết Giao dịch"
      >
        {viewingTransaction && (
          <div className="transaction-detail">
            <div className="detail-header">
              <span 
                className="detail-category-dot"
                style={{ backgroundColor: viewingTransaction.category_color }}
              ></span>
              <span className="detail-category-name">{viewingTransaction.category_name}</span>
              <span className={`detail-type-badge ${viewingTransaction.type}`}>
                {viewingTransaction.type === 'buy' ? '🟢 MUA' : '🔴 BÁN'}
              </span>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">📅 Ngày giao dịch</span>
                <span className="detail-value">{formatDate(viewingTransaction.transaction_date, 'long')}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">📦 Số lượng</span>
                <span className="detail-value number">{formatQuantity(viewingTransaction.quantity)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">💵 Giá</span>
                <span className="detail-value number">{formatCurrency(viewingTransaction.price)}</span>
              </div>

              <div className="detail-item highlight">
                <span className="detail-label">💰 Tổng giá trị</span>
                <span className={`detail-value number large ${viewingTransaction.type === 'buy' ? 'loss' : 'profit'}`}>
                  {viewingTransaction.type === 'buy' ? '-' : '+'}{formatCurrency(viewingTransaction.amount)}
                </span>
              </div>

              {viewingTransaction.notes && (
                <div className="detail-item full-width">
                  <span className="detail-label">📝 Ghi chú</span>
                  <span className="detail-value notes">{viewingTransaction.notes}</span>
                </div>
              )}

              <div className="detail-item">
                <span className="detail-label">🕐 Ngày tạo</span>
                <span className="detail-value text-muted">{formatDate(viewingTransaction.created_at, 'datetime')}</span>
              </div>
            </div>

            <div className="detail-actions">
              <button 
                className="btn btn-secondary"
                onClick={closeDetailModal}
              >
                Đóng
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  closeDetailModal();
                  openEditModal(viewingTransaction);
                }}
              >
                ✏️ Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
