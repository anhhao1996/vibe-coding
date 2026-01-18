/**
 * Expenses Page - Quản lý chi tiêu hàng tháng
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '../../components/Form';
import { expenseApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './Expenses.css';

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

const parseFormattedNumber = (value) => {
  if (!value) return '';
  return value.toString().replace(/,/g, '');
};

// Generate months for selector
const generateMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 24; i >= -6; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
    months.push({ value, label });
  }
  return months;
};

// Colors for custom tracked items
const CUSTOM_CHART_COLORS = [
  '#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c',
  '#e67e22', '#2ecc71', '#34495e', '#f1c40f', '#16a085'
];

const Expenses = () => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthData, setMonthData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthPickerRef = useRef(null);

  // Custom tracked items - load from database
  const [allItemNames, setAllItemNames] = useState([]);
  const [customTrackedItems, setCustomTrackedItems] = useState([]);
  const [customItemTrends, setCustomItemTrends] = useState({});
  const [selectedItemToAdd, setSelectedItemToAdd] = useState('');

  // Items being edited/added in the modal
  // Each item has: id (for existing items), name, amount, notes, _deleted (mark for deletion)
  const [editItems, setEditItems] = useState([]);

  // Copy form state
  const [sourceMonth, setSourceMonth] = useState('');

  const monthsList = generateMonths();

  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await expenseApi.getByMonth(currentMonth);
      setMonthData(response.data);
    } catch (err) {
      if (err.message.includes('404') || err.message.includes('Không tìm thấy')) {
        setMonthData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  const fetchTrendData = useCallback(async () => {
    try {
      const response = await expenseApi.getTrend(12);
      setTrendData(response.data || []);
    } catch (err) {
      console.error('Error fetching trend:', err);
    }
  }, []);

  // Fetch all unique expense item names
  const fetchAllItemNames = useCallback(async () => {
    try {
      const response = await expenseApi.getItemNames();
      setAllItemNames(response.data || []);
    } catch (err) {
      console.error('Error fetching item names:', err);
    }
  }, []);

  // Fetch tracked items from database
  const fetchTrackedItems = useCallback(async () => {
    try {
      const response = await expenseApi.getTrackedItems();
      setCustomTrackedItems(response.data || []);
    } catch (err) {
      console.error('Error fetching tracked items:', err);
    }
  }, []);

  // Fetch trends for custom tracked items
  const fetchCustomItemTrends = useCallback(async () => {
    if (customTrackedItems.length === 0) {
      setCustomItemTrends({});
      return;
    }
    try {
      const response = await expenseApi.getMultipleItemsTrend(customTrackedItems, 6);
      setCustomItemTrends(response.data || {});
    } catch (err) {
      console.error('Error fetching custom item trends:', err);
    }
  }, [customTrackedItems]);

  useEffect(() => {
    fetchMonthData();
    fetchTrendData();
    fetchAllItemNames();
    fetchTrackedItems();
  }, [fetchMonthData, fetchTrendData, fetchAllItemNames, fetchTrackedItems]);

  // Fetch custom item trends when customTrackedItems changes
  useEffect(() => {
    fetchCustomItemTrends();
  }, [fetchCustomItemTrends]);

  // Close month picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target)) {
        setShowMonthPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation
  const navigateMonth = (direction) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // Tạo tháng nếu chưa có
  const ensureMonthExists = async () => {
    if (!monthData) {
      try {
        const response = await expenseApi.createMonth(currentMonth, '');
        const newData = { ...response.data, items: [] };
        setMonthData(newData);
        return newData;
      } catch (err) {
        alert('Lỗi tạo tháng: ' + err.message);
        return null;
      }
    }
    return monthData;
  };

  // Mở modal thêm chi tiêu mới
  const openAddModal = async () => {
    const data = await ensureMonthExists();
    if (data) {
      setIsEditMode(false);
      setEditItems([{ name: '', amount: '', notes: '' }]);
      setShowModal(true);
    }
  };

  // Mở modal cập nhật chi tiêu (load dữ liệu từ DB)
  const openEditModal = () => {
    if (!monthData || !monthData.items || monthData.items.length === 0) {
      alert('Chưa có khoản chi tiêu nào để cập nhật');
      return;
    }
    setIsEditMode(true);
    // Load existing items into edit state
    const existingItems = monthData.items.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount.toString(),
      notes: item.notes || '',
      _deleted: false
    }));
    setEditItems(existingItems);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditItems([]);
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    setEditItems(prev => {
      const updated = [...prev];
      if (field === 'amount') {
        const rawValue = parseFormattedNumber(value);
        if (rawValue && !/^\d*\.?\d*$/.test(rawValue)) return prev;
        updated[index] = { ...updated[index], [field]: rawValue };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  // Add new row
  const addNewRow = () => {
    setEditItems(prev => [...prev, { name: '', amount: '', notes: '' }]);
  };

  // Remove/mark row for deletion
  const removeRow = (index) => {
    setEditItems(prev => {
      const item = prev[index];
      // If it's an existing item (has id), mark as deleted
      if (item.id) {
        const updated = [...prev];
        updated[index] = { ...item, _deleted: true };
        return updated;
      }
      // If it's a new item, just remove it
      if (prev.filter(i => !i._deleted).length === 1) return prev; // Keep at least one
      return prev.filter((_, i) => i !== index);
    });
  };

  // Restore deleted item
  const restoreRow = (index) => {
    setEditItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], _deleted: false };
      return updated;
    });
  };

  // Submit changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get active items (not deleted)
    const activeItems = editItems.filter(item => !item._deleted);
    const validItems = activeItems.filter(item => item.name && item.amount);
    
    if (validItems.length === 0) {
      alert('Vui lòng nhập ít nhất một khoản chi tiêu');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        // Handle updates, deletions, and additions
        for (const item of editItems) {
          if (item._deleted && item.id) {
            // Delete existing item
            await expenseApi.deleteItem(item.id);
          } else if (item.id && item.name && item.amount) {
            // Update existing item
            await expenseApi.updateItem(item.id, {
              name: item.name,
              amount: parseFloat(item.amount),
              notes: item.notes
            });
          } else if (!item.id && item.name && item.amount) {
            // Add new item
            await expenseApi.addItem(monthData.id, {
              name: item.name,
              amount: parseFloat(item.amount),
              notes: item.notes
            });
          }
        }
      } else {
        // Add all new items
        for (const item of validItems) {
          await expenseApi.addItem(monthData.id, {
            name: item.name,
            amount: parseFloat(item.amount),
            notes: item.notes
          });
        }
      }
      closeModal();
      fetchMonthData();
      fetchTrendData();
      fetchAllItemNames();
      fetchCustomItemTrends();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete all expenses for current month
  const handleDeleteAll = async () => {
    if (!monthData) return;
    
    const confirm = window.confirm(
      `⚠️ Bạn có chắc muốn xóa TẤT CẢ ${items.length} khoản chi tiêu của ${formatMonthDisplay(currentMonth)}?\n\nHành động này không thể hoàn tác!`
    );
    
    if (!confirm) return;
    
    setSubmitting(true);
    try {
      await expenseApi.deleteMonth(currentMonth);
      setMonthData(null);
      fetchTrendData();
      fetchAllItemNames();
      fetchCustomItemTrends();
      alert('✅ Đã xóa tất cả chi tiêu của tháng này!');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Copy from previous month
  const handleCopy = async () => {
    if (!sourceMonth) {
      alert('Vui lòng chọn tháng nguồn');
      return;
    }

    setSubmitting(true);
    try {
      await expenseApi.copyFromMonth(sourceMonth, currentMonth);
      setShowCopyModal(false);
      setSourceMonth('');
      fetchMonthData();
      fetchTrendData();
      fetchAllItemNames();
      fetchCustomItemTrends();
      alert('✅ Đã copy dữ liệu thành công!');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Format month for display
  const formatMonthDisplay = (month) => {
    const [year, m] = month.split('-');
    return `Tháng ${parseInt(m)}/${year}`;
  };

  // Get current month label
  const getCurrentMonthLabel = () => {
    const found = monthsList.find(m => m.value === currentMonth);
    return found ? found.label : formatMonthDisplay(currentMonth);
  };

  // Add custom tracked item
  const handleAddCustomItem = async () => {
    if (selectedItemToAdd && !customTrackedItems.includes(selectedItemToAdd)) {
      const newItems = [...customTrackedItems, selectedItemToAdd];
      try {
        await expenseApi.saveTrackedItems(newItems);
        setCustomTrackedItems(newItems);
        setSelectedItemToAdd('');
      } catch (err) {
        console.error('Error saving tracked items:', err);
        alert('Lỗi khi lưu: ' + err.message);
      }
    }
  };

  // Remove custom tracked item
  const handleRemoveCustomItem = async (itemName) => {
    const newItems = customTrackedItems.filter(name => name !== itemName);
    try {
      await expenseApi.saveTrackedItems(newItems);
      setCustomTrackedItems(newItems);
    } catch (err) {
      console.error('Error saving tracked items:', err);
      alert('Lỗi khi lưu: ' + err.message);
    }
  };

  // Get color for custom item
  const getCustomItemColor = (index) => {
    return CUSTOM_CHART_COLORS[index % CUSTOM_CHART_COLORS.length];
  };

  // Filter available items (exclude already custom tracked items only)
  const availableItemsToAdd = allItemNames.filter(name => 
    !customTrackedItems.includes(name)
  );

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{formatMonthDisplay(label)}</p>
          {payload.map((entry, index) => (
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

  // Calculate total of edit items
  const editItemsTotal = editItems
    .filter(item => !item._deleted)
    .reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);

  // Count active items
  const activeItemsCount = editItems.filter(item => !item._deleted).length;
  const deletedItemsCount = editItems.filter(item => item._deleted).length;

  if (loading) {
    return (
      <div className="expenses-page">
        <div className="page-header">
          <h1 className="page-title">💸 Quản lý Chi tiêu</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const items = monthData?.items || [];

  return (
    <div className="expenses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💸 Quản lý Chi tiêu</h1>
          <p className="page-subtitle">Theo dõi chi tiêu hàng tháng của bạn</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              const [year, month] = currentMonth.split('-').map(Number);
              const prevDate = new Date(year, month - 2, 1);
              setSourceMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
              setShowCopyModal(true);
            }}
          >
            📋 Copy từ tháng trước
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            ➕ Thêm chi tiêu
          </button>
        </div>
      </div>

      {/* Month Selector - Beautiful Calendar Style */}
      <div className="month-selector-container">
        <div className="month-selector">
          <button className="month-nav-btn" onClick={() => navigateMonth(-1)}>
            <span>◀</span>
          </button>
          
          <div className="month-picker-wrapper" ref={monthPickerRef}>
            <button 
              className="month-display-btn"
              onClick={() => setShowMonthPicker(!showMonthPicker)}
            >
              <span className="month-icon">📅</span>
              <span className="month-text">{getCurrentMonthLabel()}</span>
              <span className={`month-arrow ${showMonthPicker ? 'open' : ''}`}>▼</span>
            </button>
            
            {showMonthPicker && (
              <div className="month-dropdown">
                <div className="month-dropdown-header">Chọn tháng</div>
                <div className="month-list">
                  {monthsList.map(month => (
                    <button
                      key={month.value}
                      className={`month-option ${month.value === currentMonth ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentMonth(month.value);
                        setShowMonthPicker(false);
                      }}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button className="month-nav-btn" onClick={() => navigateMonth(1)}>
            <span>▶</span>
          </button>
        </div>

        <div className="month-summary">
          <div className="summary-item">
            <span className="summary-label">Tổng chi tiêu</span>
            <span className="summary-value">{formatCurrency(monthData?.total_amount || 0)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Số khoản</span>
            <span className="summary-count">{items.length}</span>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="expense-list-container">
        <div className="expense-list-header">
          <h3>📋 Chi tiết chi tiêu</h3>
          {items.length > 0 && (
            <div className="list-header-actions">
              <button className="btn btn-outline btn-sm" onClick={openEditModal}>
                ✏️ Cập nhật chi tiêu
              </button>
              <button 
                className="btn btn-outline btn-sm btn-danger-outline" 
                onClick={handleDeleteAll}
                disabled={submitting}
              >
                🗑️ Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h3>Chưa có khoản chi tiêu nào</h3>
            <p>Bắt đầu thêm các khoản chi tiêu cho tháng này</p>
            <button className="btn btn-primary" onClick={openAddModal}>
              ➕ Thêm chi tiêu
            </button>
          </div>
        ) : (
          <div className="expense-table-wrapper">
            <table className="expense-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Tên khoản chi</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>Số tiền</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="text-center text-muted">{index + 1}</td>
                    <td className="expense-name">{item.name}</td>
                    <td className="text-right number expense-amount">{formatCurrency(item.amount)}</td>
                    <td className="text-muted expense-notes">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="2"><strong>TỔNG CỘNG</strong></td>
                  <td className="text-right number"><strong>{formatCurrency(monthData?.total_amount || 0)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Charts Section */}
      {trendData.length > 1 && (
        <div className="charts-section">
          {/* Main Total Chart */}
          <div className="expense-chart-container">
            <h3 className="chart-title">📊 Biến thiên Chi tiêu (12 tháng gần nhất)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(month) => {
                    const [, m] = month.split('-');
                    return `T${parseInt(m)}`;
                  }}
                />
                <YAxis 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="total_amount" 
                  name="Chi tiêu"
                  stroke="var(--primary-500)" 
                  strokeWidth={3}
                  dot={{ fill: 'var(--primary-500)', r: 5 }}
                  activeDot={{ r: 7, fill: 'var(--primary-600)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Custom Tracked Items Section */}
      <div className="custom-charts-section">
        <div className="custom-charts-header">
          <h3 className="section-title">📈 Biểu đồ tùy chọn (6 tháng gần nhất)</h3>
          <div className="add-chart-form">
            <select 
              className="form-select chart-select"
              value={selectedItemToAdd}
              onChange={(e) => setSelectedItemToAdd(e.target.value)}
            >
              <option value="">-- Chọn loại chi tiêu --</option>
              {availableItemsToAdd.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleAddCustomItem}
              disabled={!selectedItemToAdd}
            >
              ➕ Thêm biểu đồ
            </button>
          </div>
        </div>

        {customTrackedItems.length === 0 ? (
          <div className="custom-charts-empty">
            <span className="empty-icon">📊</span>
            <p>Chọn loại chi tiêu từ dropdown bên trên để thêm biểu đồ theo dõi</p>
          </div>
        ) : (
          <div className="custom-charts-grid">
            {customTrackedItems.map((itemName, index) => {
              const itemData = customItemTrends[itemName] || [];
              const hasData = itemData.some(d => parseFloat(d.amount) > 0);
              const itemColor = getCustomItemColor(index);
              
              // Calculate max value with padding
              const maxAmount = Math.max(...itemData.map(d => parseFloat(d.amount) || 0));
              const yAxisMax = maxAmount > 0 
                ? Math.ceil(maxAmount * 1.2 / 100000) * 100000 
                : 1000000;
              
              return (
                <div key={itemName} className="custom-chart-container">
                  <div className="custom-chart-header">
                    <h4 className="custom-chart-title" style={{ color: itemColor }}>
                      📌 {itemName}
                    </h4>
                    <button 
                      className="remove-chart-btn"
                      onClick={() => handleRemoveCustomItem(itemName)}
                      title="Xóa biểu đồ"
                    >
                      ✕
                    </button>
                  </div>
                  {hasData ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={itemData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                          tickFormatter={(month) => {
                            const [, m] = month.split('-');
                            return `T${parseInt(m)}`;
                          }}
                        />
                        <YAxis 
                          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                            return value;
                          }}
                          width={45}
                          domain={[0, yAxisMax]}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="chart-tooltip">
                                  <p className="tooltip-label">{formatMonthDisplay(label)}</p>
                                  <p className="tooltip-value" style={{ color: itemColor }}>
                                    <span>{itemName}:</span>
                                    <span className="number">{formatCurrency(payload[0].value)}</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          name={itemName}
                          stroke={itemColor}
                          strokeWidth={2}
                          dot={{ fill: itemColor, r: 4 }}
                          activeDot={{ r: 6, fill: itemColor }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-chart">
                      <span>📭</span>
                      <p>Chưa có dữ liệu</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Items Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={isEditMode 
          ? `✏️ Cập nhật chi tiêu - ${formatMonthDisplay(currentMonth)}` 
          : `➕ Thêm chi tiêu - ${formatMonthDisplay(currentMonth)}`
        }
      >
        <form className="add-items-form" onSubmit={handleSubmit}>
          {isEditMode && deletedItemsCount > 0 && (
            <div className="deleted-notice">
              ⚠️ {deletedItemsCount} khoản chi sẽ bị xóa khi lưu
            </div>
          )}
          
          <div className="items-table-container">
            <table className="items-input-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Tên khoản chi <span className="required">*</span></th>
                  <th style={{ width: '30%' }}>Số tiền (VND) <span className="required">*</span></th>
                  <th style={{ width: '25%' }}>Ghi chú</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {editItems.map((item, index) => (
                  <tr 
                    key={item.id || `new-${index}`} 
                    className={`animate-fade-in ${item._deleted ? 'deleted-row' : ''}`}
                  >
                    <td>
                      <input
                        type="text"
                        className="table-input"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="VD: Tiền điện, Trả nợ NH..."
                        disabled={submitting || item._deleted}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="table-input text-right"
                        value={formatNumberInput(item.amount)}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        placeholder="0"
                        inputMode="decimal"
                        disabled={submitting || item._deleted}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="table-input"
                        value={item.notes}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        placeholder="Ghi chú..."
                        disabled={submitting || item._deleted}
                      />
                    </td>
                    <td>
                      {item._deleted ? (
                        <button
                          type="button"
                          className="restore-row-btn"
                          onClick={() => restoreRow(index)}
                          disabled={submitting}
                          title="Khôi phục"
                        >
                          ↩️
                        </button>
                      ) : (
                        (activeItemsCount > 1 || item.id) && (
                          <button
                            type="button"
                            className="remove-row-btn"
                            onClick={() => removeRow(index)}
                            disabled={submitting}
                            title="Xóa"
                          >
                            ✕
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="btn btn-outline add-row-btn"
            onClick={addNewRow}
            disabled={submitting}
          >
            ➕ Thêm dòng mới
          </button>

          <div className="form-footer">
            <div className="form-total">
              <span>Tổng cộng:</span>
              <span className="total-amount">{formatCurrency(editItemsTotal)}</span>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || editItems.filter(i => !i._deleted).every(item => !item.name || !item.amount)}
              >
                {submitting ? '⏳ Đang lưu...' : '✓ Lưu thay đổi'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Copy Modal */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        title="📋 Copy dữ liệu từ tháng trước"
      >
        <div className="copy-form">
          <div className="form-group">
            <label className="form-label">Tháng nguồn</label>
            <select
              className="form-select"
              value={sourceMonth}
              onChange={(e) => setSourceMonth(e.target.value)}
            >
              <option value="">-- Chọn tháng --</option>
              {monthsList.filter(m => m.value !== currentMonth).map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          <div className="copy-arrow">⬇️</div>

          <div className="copy-info">
            <strong>Tháng đích:</strong> {formatMonthDisplay(currentMonth)}
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Tất cả khoản chi tiêu từ tháng nguồn sẽ được copy sang tháng này với giá trị giữ nguyên.
            </p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCopyModal(false)} disabled={submitting}>
              Hủy
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleCopy}
              disabled={submitting || !sourceMonth}
            >
              {submitting ? 'Đang copy...' : '📋 Copy dữ liệu'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;
