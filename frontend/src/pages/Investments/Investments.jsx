/**
 * Investments Page - Quản lý danh mục đầu tư
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CategoryForm, TransactionForm, Modal } from '../../components/Form';
import { categoryApi, transactionApi, portfolioApi, priceApi } from '../../services/api';
import { formatCurrency, formatPercentage, getPnlClass, formatQuantity } from '../../utils/formatters';
import './Investments.css';

// Format số với dấu phân cách (dấu , cho ngàn/triệu, dấu . cho thập phân)
const formatNumberInput = (value) => {
  if (!value && value !== 0) return '';
  const str = value.toString().replace(/,/g, '');
  
  // Tách phần nguyên và thập phân
  const parts = str.split('.');
  // Format phần nguyên với dấu phẩy
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

// Parse số từ string có format
const parseFormattedNumber = (value) => {
  if (!value) return '';
  return value.toString().replace(/,/g, '');
};

const Investments = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [updatingCategory, setUpdatingCategory] = useState(null);
  const [currentPrice, setCurrentPrice] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingDCDS, setFetchingDCDS] = useState(null); // categoryId đang fetch
  const [fetchingGold, setFetchingGold] = useState(null); // categoryId đang fetch giá vàng
  const [fetchingUSD, setFetchingUSD] = useState(null); // categoryId đang fetch giá USD
  const [updatingAll, setUpdatingAll] = useState(false); // Đang cập nhật toàn bộ

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async (data) => {
    setSubmitting(true);
    try {
      await categoryApi.create(data);
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCategory = async (data) => {
    setSubmitting(true);
    try {
      await categoryApi.update(editingCategory.id, data);
      setShowCategoryModal(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này? Tất cả giao dịch liên quan sẽ bị xóa.')) {
      return;
    }
    try {
      await categoryApi.delete(id);
      fetchCategories();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCreateTransaction = async (data) => {
    setSubmitting(true);
    try {
      await transactionApi.create(data);
      setShowTransactionModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const openAddTransaction = (category) => {
    setSelectedCategory(category);
    setShowTransactionModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedCategory(null);
  };

  const openPriceModal = (category) => {
    setUpdatingCategory(category);
    // Tính giá hiện tại từ current_value / quantity
    const quantity = parseFloat(category.quantity) || 0;
    const currentValue = parseFloat(category.current_value) || 0;
    const price = quantity > 0 ? (currentValue / quantity) : 0;
    const priceStr = price > 0 ? price.toString() : '';
    setCurrentPrice(priceStr);
    setDisplayPrice(priceStr ? formatNumberInput(priceStr) : '');
    setShowPriceModal(true);
  };

  const closePriceModal = () => {
    setShowPriceModal(false);
    setUpdatingCategory(null);
    setCurrentPrice('');
    setDisplayPrice('');
  };

  const handlePriceInputChange = (e) => {
    const rawValue = parseFormattedNumber(e.target.value);
    if (rawValue && !/^\d*\.?\d*$/.test(rawValue)) return;
    setCurrentPrice(rawValue);
    setDisplayPrice(formatNumberInput(rawValue));
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!updatingCategory || !currentPrice) return;

    setSubmitting(true);
    try {
      const quantity = parseFloat(updatingCategory.quantity) || 0;
      const price = parseFloat(currentPrice) || 0;
      const newValue = quantity * price;

      await portfolioApi.updateCurrentValue(updatingCategory.id, newValue);
      closePriceModal();
      fetchCategories();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Lấy giá DCDS từ Dragon Capital API
  const fetchDCDSPrice = async (categoryId) => {
    setFetchingDCDS(categoryId);
    try {
      const response = await priceApi.updateCategoryWithDCDS(categoryId);
      const data = response.data;
      alert(`✅ Đã cập nhật giá DCDS!\n\nGiá: ${formatCurrency(data.price)}\nNgày: ${data.date}\nGiá trị mới: ${formatCurrency(data.newValue)}`);
      fetchCategories();
    } catch (err) {
      alert('❌ Lỗi lấy giá DCDS: ' + err.message);
    } finally {
      setFetchingDCDS(null);
    }
  };

  // Lấy giá vàng từ vnappmob API
  const fetchGoldPrice = async (categoryId) => {
    setFetchingGold(categoryId);
    try {
      const response = await priceApi.updateCategoryWithGold(categoryId);
      const data = response.data;
      alert(`✅ Đã cập nhật giá vàng!\n\nGiá: ${formatCurrency(data.price)}/lượng\nLoại: ${data.type}\nGiá trị mới: ${formatCurrency(data.newValue)}`);
      fetchCategories();
    } catch (err) {
      alert('❌ Lỗi lấy giá vàng: ' + err.message);
    } finally {
      setFetchingGold(null);
    }
  };

  // Kiểm tra category có phải DCDS không
  const isDCDSCategory = (categoryName) => {
    return categoryName?.toUpperCase().includes('DCDS');
  };

  // Kiểm tra category có phải Vàng không
  const isGoldCategory = (categoryName) => {
    const name = categoryName?.toUpperCase() || '';
    return name.includes('VÀNG') || name.includes('VANG') || name.includes('GOLD') || name.includes('SJC');
  };

  // Kiểm tra category có phải USD không
  const isUSDCategory = (categoryName) => {
    const name = categoryName?.toUpperCase() || '';
    return name.includes('USD') || name.includes('ĐÔ LA') || name.includes('DO LA') || name.includes('DOLLAR');
  };

  // Lấy tỷ giá USD từ Vietcombank API
  const fetchUSDPrice = async (categoryId) => {
    setFetchingUSD(categoryId);
    try {
      const response = await priceApi.updateCategoryWithUSD(categoryId);
      const data = response.data;
      alert(`✅ Đã cập nhật tỷ giá USD!\n\nTỷ giá: ${formatCurrency(data.price)}/USD\nNguồn: ${data.source}\nGiá trị mới: ${formatCurrency(data.newValue)}`);
      fetchCategories();
    } catch (err) {
      alert('❌ Lỗi lấy tỷ giá USD: ' + err.message);
    } finally {
      setFetchingUSD(null);
    }
  };

  // Cập nhật giá toàn bộ danh mục
  const updateAllPrices = async () => {
    setUpdatingAll(true);
    
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const category of categories) {
      // Bỏ qua các danh mục không có số lượng
      if (parseFloat(category.quantity) <= 0) {
        results.skipped.push(category.name);
        continue;
      }

      try {
        if (isDCDSCategory(category.name)) {
          await priceApi.updateCategoryWithDCDS(category.id);
          results.success.push(`${category.name} (DCDS)`);
        } else if (isGoldCategory(category.name)) {
          await priceApi.updateCategoryWithGold(category.id);
          results.success.push(`${category.name} (Vàng)`);
        } else if (isUSDCategory(category.name)) {
          await priceApi.updateCategoryWithUSD(category.id);
          results.success.push(`${category.name} (USD)`);
        } else {
          // Danh mục không có API tự động
          results.skipped.push(`${category.name} (không có API)`);
        }
      } catch (err) {
        results.failed.push(`${category.name}: ${err.message}`);
      }
    }

    // Hiển thị kết quả
    let message = '📊 Kết quả cập nhật giá:\n\n';
    
    if (results.success.length > 0) {
      message += `✅ Thành công (${results.success.length}):\n${results.success.map(s => `  • ${s}`).join('\n')}\n\n`;
    }
    
    if (results.failed.length > 0) {
      message += `❌ Thất bại (${results.failed.length}):\n${results.failed.map(f => `  • ${f}`).join('\n')}\n\n`;
    }
    
    if (results.skipped.length > 0) {
      message += `⏭️ Bỏ qua (${results.skipped.length}):\n${results.skipped.map(s => `  • ${s}`).join('\n')}`;
    }

    alert(message);
    fetchCategories();
    setUpdatingAll(false);
  };

  if (loading) {
    return (
      <div className="investments-page">
        <div className="page-header">
          <h1 className="page-title">💰 Quản lý Đầu tư</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="investments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Quản lý Đầu tư</h1>
          <p className="page-subtitle">Tạo và quản lý các danh mục đầu tư của bạn</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={updateAllPrices}
            disabled={updatingAll || categories.length === 0}
          >
            {updatingAll ? '⏳ Đang cập nhật...' : '🔄 Cập nhật toàn bộ'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCategoryModal(true)}
          >
            ➕ Tạo danh mục mới
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-secondary" onClick={fetchCategories}>
            Thử lại
          </button>
        </div>
      )}

      <div className="categories-grid">
        {categories.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📁</span>
            <h3>Chưa có danh mục nào</h3>
            <p>Bắt đầu bằng cách tạo danh mục đầu tư đầu tiên</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCategoryModal(true)}
            >
              ➕ Tạo danh mục
            </button>
          </div>
        ) : (
          categories.map((category, index) => {
            const pnl = (parseFloat(category.current_value) || 0) - (parseFloat(category.total_invested) || 0);
            const pnlPercentage = parseFloat(category.total_invested) > 0 
              ? (pnl / parseFloat(category.total_invested) * 100) 
              : 0;
            const pnlClass = getPnlClass(pnl);

            return (
              <div 
                key={category.id} 
                className="category-card animate-fade-in"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  '--category-color': category.color || '#4CAF50'
                }}
              >
                <div className="category-card-header">
                  <div className="category-info">
                    <span 
                      className="category-color-dot"
                      style={{ backgroundColor: category.color }}
                    ></span>
                    <h3 className="category-name">{category.name}</h3>
                  </div>
                  <div className="category-actions">
                    <button 
                      className="action-btn"
                      onClick={() => openEditCategory(category)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn danger"
                      onClick={() => handleDeleteCategory(category.id)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}

                <div className="category-stats">
                  <div className="stat-row">
                    <span className="stat-label">Số lượng nắm giữ</span>
                    <span className="stat-value number">{formatQuantity(category.quantity)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Tổng đầu tư</span>
                    <span className="stat-value number">{formatCurrency(category.total_invested)}</span>
                  </div>
                  <div className="stat-row highlight">
                    <span className="stat-label">💰 Giá trị hiện tại</span>
                    <span className="stat-value number">{formatCurrency(category.current_value)}</span>
                  </div>
                  <div className={`stat-row pnl-row ${pnlClass}`}>
                    <span className="stat-label">📈 Lãi/Lỗ</span>
                    <span className={`stat-value number ${pnlClass}`}>
                      {formatCurrency(pnl)} ({formatPercentage(pnlPercentage)})
                    </span>
                  </div>
                </div>

                <div className="category-card-footer">
                  {isDCDSCategory(category.name) ? (
                    <button 
                      className="btn btn-dcds btn-sm"
                      onClick={() => fetchDCDSPrice(category.id)}
                      disabled={fetchingDCDS === category.id || parseFloat(category.quantity) <= 0}
                    >
                      {fetchingDCDS === category.id ? '⏳ Đang lấy...' : '🐉 Lấy giá DCDS'}
                    </button>
                  ) : isGoldCategory(category.name) ? (
                    <button 
                      className="btn btn-gold btn-sm"
                      onClick={() => fetchGoldPrice(category.id)}
                      disabled={fetchingGold === category.id || parseFloat(category.quantity) <= 0}
                    >
                      {fetchingGold === category.id ? '⏳ Đang lấy...' : '🥇 Lấy giá vàng'}
                    </button>
                  ) : isUSDCategory(category.name) ? (
                    <button 
                      className="btn btn-usd btn-sm"
                      onClick={() => fetchUSDPrice(category.id)}
                      disabled={fetchingUSD === category.id || parseFloat(category.quantity) <= 0}
                    >
                      {fetchingUSD === category.id ? '⏳ Đang lấy...' : '💵 Lấy giá USD'}
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openPriceModal(category)}
                      disabled={parseFloat(category.quantity) <= 0}
                    >
                      📊 Cập nhật giá
                    </button>
                  )}
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => openAddTransaction(category)}
                  >
                    ➕ Thêm giao dịch
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={closeCategoryModal}
        title={editingCategory ? '✏️ Sửa danh mục' : '➕ Tạo danh mục mới'}
      >
        <CategoryForm
          initialData={editingCategory}
          onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onCancel={closeCategoryModal}
          isLoading={submitting}
        />
      </Modal>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={closeTransactionModal}
        title={`📝 Thêm giao dịch${selectedCategory ? ` - ${selectedCategory.name}` : ''}`}
      >
        <TransactionForm
          categories={categories}
          initialData={selectedCategory ? { category_id: selectedCategory.id } : null}
          onSubmit={handleCreateTransaction}
          onCancel={closeTransactionModal}
          isLoading={submitting}
        />
      </Modal>

      {/* Update Price Modal */}
      <Modal
        isOpen={showPriceModal}
        onClose={closePriceModal}
        title={`📊 Cập nhật giá - ${updatingCategory?.name || ''}`}
      >
        {updatingCategory && (
          <form className="price-update-form" onSubmit={handleUpdatePrice}>
            <div className="price-info">
              <div className="info-row">
                <span className="info-label">Số lượng đang nắm giữ:</span>
                <span className="info-value number">{formatQuantity(updatingCategory.quantity)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Giá vốn trung bình:</span>
                <span className="info-value number">{formatCurrency(updatingCategory.average_price)}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                💵 Giá hiện tại (1 đơn vị) <span className="required">*</span>
              </label>
              <input
                type="text"
                value={displayPrice}
                onChange={handlePriceInputChange}
                className="form-input"
                placeholder="Nhập giá hiện tại..."
                inputMode="decimal"
                required
                disabled={submitting}
              />
            </div>

            {currentPrice && parseFloat(currentPrice) > 0 && (
              <div className="price-preview">
                <div className="preview-row">
                  <span>Giá trị mới:</span>
                  <span className="number">{formatCurrency(parseFloat(updatingCategory.quantity) * parseFloat(currentPrice))}</span>
                </div>
                <div className="preview-row">
                  <span>Lãi/Lỗ dự kiến:</span>
                  <span className={`number ${getPnlClass((parseFloat(updatingCategory.quantity) * parseFloat(currentPrice)) - parseFloat(updatingCategory.total_invested))}`}>
                    {formatCurrency((parseFloat(updatingCategory.quantity) * parseFloat(currentPrice)) - parseFloat(updatingCategory.total_invested))}
                  </span>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closePriceModal}
                disabled={submitting}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || !currentPrice}
              >
                {submitting ? 'Đang cập nhật...' : '✓ Cập nhật giá'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Investments;
