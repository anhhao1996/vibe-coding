/**
 * Savings Page - Quản lý tiết kiệm
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/Form';
import { savingsApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import './Savings.css';

const formatNumberInput = (value) => {
  if (!value && value !== 0) return '';
  const str = value.toString().replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const parseFormattedNumber = (value) => {
  if (!value) return '';
  return value.toString().replace(/,/g, '');
};

const TRANSACTION_TYPES = {
  deposit: { label: 'Nạp vào', icon: '💰', className: 'type-deposit' },
  withdrawal: { label: 'Rút ra', icon: '💸', className: 'type-withdrawal' },
  interest: { label: 'Tiền lãi', icon: '📈', className: 'type-interest' }
};

const Savings = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDetail, setBookDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Book form
  const [bookForm, setBookForm] = useState({ name: '', description: '', color: '#2196F3' });

  // Transaction form
  const [txForm, setTxForm] = useState({
    type: 'deposit',
    amount: '',
    interest_rate: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await savingsApi.getAll();
      setBooks(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const fetchBookDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const response = await savingsApi.getById(id);
      setBookDetail(response.data);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Book CRUD
  const openCreateBook = () => {
    setEditingBook(null);
    setBookForm({ name: '', description: '', color: '#2196F3' });
    setShowBookModal(true);
  };

  const openEditBook = (book) => {
    setEditingBook(book);
    setBookForm({ name: book.name, description: book.description || '', color: book.color || '#2196F3' });
    setShowBookModal(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookForm.name.trim()) {
      alert('Vui lòng nhập tên sổ tiết kiệm');
      return;
    }
    setSubmitting(true);
    try {
      if (editingBook) {
        await savingsApi.update(editingBook.id, bookForm);
      } else {
        await savingsApi.create(bookForm);
      }
      setShowBookModal(false);
      fetchBooks();
      if (bookDetail && editingBook && bookDetail.id === editingBook.id) {
        fetchBookDetail(editingBook.id);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sổ tiết kiệm này? Tất cả giao dịch liên quan sẽ bị xóa.')) {
      return;
    }
    try {
      await savingsApi.delete(id);
      fetchBooks();
      if (showDetailModal && bookDetail?.id === id) {
        setShowDetailModal(false);
        setBookDetail(null);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Transaction CRUD
  const openAddTransaction = (book) => {
    setSelectedBook(book);
    setTxForm({
      type: 'deposit',
      amount: '',
      interest_rate: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowTransactionModal(true);
  };

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(parseFormattedNumber(txForm.amount)) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    setSubmitting(true);
    try {
      await savingsApi.addTransaction(selectedBook.id, {
        type: txForm.type,
        amount: parseFloat(parseFormattedNumber(txForm.amount)),
        interest_rate: txForm.type === 'deposit' && txForm.interest_rate
          ? parseFloat(txForm.interest_rate)
          : null,
        transaction_date: txForm.transaction_date,
        notes: txForm.notes
      });
      setShowTransactionModal(false);
      fetchBooks();
      if (showDetailModal && bookDetail?.id === selectedBook.id) {
        fetchBookDetail(selectedBook.id);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    try {
      await savingsApi.deleteTransaction(txId);
      fetchBooks();
      if (bookDetail) {
        fetchBookDetail(bookDetail.id);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openDetail = (book) => {
    setShowDetailModal(true);
    fetchBookDetail(book.id);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };

  // Totals across all books
  const totalBalance = books.reduce((sum, b) => sum + parseFloat(b.balance || 0), 0);
  const totalDeposited = books.reduce((sum, b) => sum + parseFloat(b.total_deposited || 0), 0);
  const totalWithdrawn = books.reduce((sum, b) => sum + parseFloat(b.total_withdrawn || 0), 0);
  const totalInterest = books.reduce((sum, b) => sum + parseFloat(b.total_interest || 0), 0);

  if (loading) {
    return (
      <div className="savings-page">
        <div className="page-header">
          <h1 className="page-title">🏦 Quản lý Tiết kiệm</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="savings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏦 Quản lý Tiết kiệm</h1>
          <p className="page-subtitle">Theo dõi các sổ tiết kiệm của bạn</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openCreateBook}>
            ➕ Tạo sổ mới
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-secondary" onClick={fetchBooks}>Thử lại</button>
        </div>
      )}

      {/* Summary Cards */}
      {books.length > 0 && (
        <div className="savings-summary">
          <div className="summary-card">
            <span className="summary-icon">💰</span>
            <div className="summary-info">
              <span className="summary-label">Tổng số dư</span>
              <span className="summary-value number">{formatCurrency(totalBalance)}</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">📥</span>
            <div className="summary-info">
              <span className="summary-label">Tổng đã nạp</span>
              <span className="summary-value number">{formatCurrency(totalDeposited)}</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">📤</span>
            <div className="summary-info">
              <span className="summary-label">Tổng rút ra</span>
              <span className="summary-value number withdrawn-value">{formatCurrency(totalWithdrawn)}</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">📈</span>
            <div className="summary-info">
              <span className="summary-label">Tổng lãi nhận</span>
              <span className="summary-value number interest-value">{formatCurrency(totalInterest)}</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">📚</span>
            <div className="summary-info">
              <span className="summary-label">Số sổ tiết kiệm</span>
              <span className="summary-value number">{books.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Savings Books Grid */}
      <div className="savings-grid">
        {books.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏦</span>
            <h3>Chưa có sổ tiết kiệm nào</h3>
            <p>Bắt đầu bằng cách tạo sổ tiết kiệm đầu tiên</p>
            <button className="btn btn-primary" onClick={openCreateBook}>
              ➕ Tạo sổ mới
            </button>
          </div>
        ) : (
          books.map((book, index) => {
            const balance = parseFloat(book.balance || 0);
            const deposited = parseFloat(book.total_deposited || 0);
            const withdrawn = parseFloat(book.total_withdrawn || 0);
            const interest = parseFloat(book.total_interest || 0);

            return (
              <div
                key={book.id}
                className="savings-card animate-fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  '--savings-color': book.color || '#2196F3'
                }}
              >
                <div className="savings-card-header">
                  <div className="savings-info">
                    <span className="savings-color-dot" style={{ backgroundColor: book.color }}></span>
                    <h3 className="savings-name">{book.name}</h3>
                  </div>
                  <div className="savings-actions">
                    <button className="action-btn" onClick={() => openEditBook(book)} title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button className="action-btn danger" onClick={() => handleDeleteBook(book.id)} title="Xóa">
                      🗑️
                    </button>
                  </div>
                </div>

                {book.description && (
                  <p className="savings-description">{book.description}</p>
                )}

                <div className="savings-stats">
                  <div className="stat-row highlight">
                    <span className="stat-label">💰 Số dư hiện tại</span>
                    <span className="stat-value number">{formatCurrency(balance)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">📥 Tổng nạp vào</span>
                    <span className="stat-value number">{formatCurrency(deposited)}</span>
                  </div>
                  {withdrawn > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">📤 Tổng rút ra</span>
                      <span className="stat-value number withdrawn-value">{formatCurrency(withdrawn)}</span>
                    </div>
                  )}
                  <div className="stat-row interest-row">
                    <span className="stat-label">📈 Tiền lãi</span>
                    <span className="stat-value number interest-value">{formatCurrency(interest)}</span>
                  </div>
                </div>

                <div className="savings-card-footer">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openDetail(book)}
                  >
                    📋 Chi tiết
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openAddTransaction(book)}
                  >
                    ➕ Giao dịch
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Book Create/Edit Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title={editingBook ? '✏️ Sửa sổ tiết kiệm' : '➕ Tạo sổ tiết kiệm mới'}
      >
        <form className="savings-form" onSubmit={handleBookSubmit}>
          <div className="form-group">
            <label className="form-label">
              Tên sổ tiết kiệm <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={bookForm.name}
              onChange={(e) => setBookForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Tiết kiệm Techcombank, Gửi kỳ hạn 6 tháng..."
              disabled={submitting}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <input
              type="text"
              className="form-input"
              value={bookForm.description}
              onChange={(e) => setBookForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn (không bắt buộc)"
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Màu sắc</label>
            <div className="color-picker-row">
              {['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B'].map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-option ${bookForm.color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setBookForm(prev => ({ ...prev, color: c }))}
                />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '⏳ Đang lưu...' : '✓ Lưu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title={`💳 Giao dịch - ${selectedBook?.name || ''}`}
      >
        <form className="savings-form" onSubmit={handleTxSubmit}>
          <div className="form-group">
            <label className="form-label">Loại giao dịch <span className="required">*</span></label>
            <div className="tx-type-selector">
              {Object.entries(TRANSACTION_TYPES).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  className={`tx-type-btn ${info.className} ${txForm.type === key ? 'active' : ''}`}
                  onClick={() => setTxForm(prev => ({ ...prev, type: key }))}
                  disabled={submitting}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Số tiền (VND) <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input text-right"
              value={formatNumberInput(txForm.amount)}
              onChange={(e) => {
                const raw = parseFormattedNumber(e.target.value);
                if (raw && !/^\d*\.?\d*$/.test(raw)) return;
                setTxForm(prev => ({ ...prev, amount: raw }));
              }}
              placeholder="0"
              inputMode="decimal"
              disabled={submitting}
              required
            />
          </div>

          {txForm.type === 'deposit' && (
            <div className="form-group">
              <label className="form-label">
                Lãi suất (%/năm) <span className="form-hint">- tham khảo</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={txForm.interest_rate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !/^\d*\.?\d*$/.test(val)) return;
                  setTxForm(prev => ({ ...prev, interest_rate: val }));
                }}
                placeholder="VD: 5.5"
                inputMode="decimal"
                disabled={submitting}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Ngày giao dịch <span className="required">*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={txForm.transaction_date}
              onChange={(e) => setTxForm(prev => ({ ...prev, transaction_date: e.target.value }))}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <input
              type="text"
              className="form-input"
              value={txForm.notes}
              onChange={(e) => setTxForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ghi chú (không bắt buộc)"
              disabled={submitting}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowTransactionModal(false)} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '⏳ Đang lưu...' : '✓ Thêm giao dịch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setBookDetail(null); }}
        title={`📋 Chi tiết - ${bookDetail?.name || 'Đang tải...'}`}
      >
        {loadingDetail ? (
          <div className="loading-state" style={{ padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : bookDetail ? (
          <div className="detail-content">
            <div className="detail-summary">
              <div className="detail-summary-row">
                <span>Số dư hiện tại</span>
                <span className="number detail-balance">{formatCurrency(bookDetail.balance)}</span>
              </div>
              <div className="detail-summary-row">
                <span>Tổng nạp</span>
                <span className="number">{formatCurrency(bookDetail.total_deposited)}</span>
              </div>
              <div className="detail-summary-row">
                <span>Tổng rút</span>
                <span className="number withdrawn-value">{formatCurrency(bookDetail.total_withdrawn)}</span>
              </div>
              <div className="detail-summary-row">
                <span>Tổng lãi</span>
                <span className="number interest-value">{formatCurrency(bookDetail.total_interest)}</span>
              </div>
            </div>

            <h4 className="detail-section-title">Lịch sử giao dịch ({bookDetail.transactions?.length || 0})</h4>

            {(!bookDetail.transactions || bookDetail.transactions.length === 0) ? (
              <div className="no-transactions">
                <p>Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="transactions-list">
                {bookDetail.transactions.map((tx) => {
                  const typeInfo = TRANSACTION_TYPES[tx.type];
                  return (
                    <div key={tx.id} className={`transaction-item ${typeInfo.className}`}>
                      <div className="tx-left">
                        <span className="tx-icon">{typeInfo.icon}</span>
                        <div className="tx-info">
                          <span className="tx-type-label">{typeInfo.label}</span>
                          <span className="tx-date">{formatDate(tx.transaction_date)}</span>
                          {tx.type === 'deposit' && tx.interest_rate && (
                            <span className="tx-rate">LS: {parseFloat(tx.interest_rate).toFixed(2)}%/năm</span>
                          )}
                          {tx.notes && <span className="tx-notes">{tx.notes}</span>}
                        </div>
                      </div>
                      <div className="tx-right">
                        <span className={`tx-amount number ${tx.type === 'withdrawal' ? 'withdrawn-value' : tx.type === 'interest' ? 'interest-value' : ''}`}>
                          {tx.type === 'withdrawal' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </span>
                        <button
                          className="tx-delete-btn"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          title="Xóa giao dịch"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Savings;
