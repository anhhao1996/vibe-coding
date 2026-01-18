/**
 * Transaction Form Component - Tạo/Sửa giao dịch
 */
import React, { useState, useEffect } from 'react';
import './Form.css';

// Format số với dấu phân cách hàng nghìn (dấu , cho ngàn/triệu, dấu . cho thập phân)
const formatNumberDisplay = (value) => {
  if (!value && value !== 0) return '';
  const str = value.toString().replace(/,/g, '');
  
  // Tách phần nguyên và thập phân
  const parts = str.split('.');
  // Format phần nguyên với dấu phẩy
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

// Format quantity để hiển thị - giữ tối đa 2 số thập phân, bỏ số 0 thừa
const formatQuantityDisplay = (value) => {
  if (!value && value !== 0) return '';
  const num = parseFloat(value.toString().replace(/,/g, ''));
  if (isNaN(num)) return '';
  
  // Nếu là số nguyên thì không hiện thập phân
  if (num % 1 === 0) return num.toString();
  // Nếu có thập phân thì giữ tối đa 2 chữ số, bỏ số 0 thừa
  return parseFloat(num.toFixed(2)).toString();
};

// Parse số từ string có format (bỏ dấu phẩy ngăn cách hàng nghìn)
const parseFormattedNumber = (value) => {
  if (!value) return '';
  return value.toString().replace(/,/g, '');
};

const TransactionForm = ({ 
  categories = [],
  onSubmit, 
  initialData = null, 
  isLoading = false,
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    category_id: '',
    type: 'buy',
    quantity: '',
    price: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [displayPrice, setDisplayPrice] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      // Format quantity với max 2 decimal places (bỏ số 0 thừa)
      const formattedQuantity = formatQuantityDisplay(initialData.quantity);
      // Format price với dấu phẩy ngăn cách hàng nghìn
      const rawPrice = parseFloat(initialData.price) || 0;
      const formattedPrice = formatNumberDisplay(Math.round(rawPrice)); // Làm tròn giá
      
      setFormData({
        category_id: initialData.category_id || '',
        type: initialData.type || 'buy',
        quantity: formattedQuantity,
        price: Math.round(rawPrice).toString(),
        transaction_date: initialData.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: initialData.notes || ''
      });
      setDisplayPrice(formattedPrice);
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.category_id) {
      newErrors.category_id = 'Vui lòng chọn danh mục';
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Số lượng phải lớn hơn 0';
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Giá không hợp lệ';
    }
    
    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Vui lòng chọn ngày giao dịch';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? value : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePriceChange = (e) => {
    const rawValue = parseFormattedNumber(e.target.value);
    // Chỉ cho phép số và dấu chấm (cho thập phân)
    if (rawValue && !/^\d*\.?\d*$/.test(rawValue)) return;
    
    setFormData(prev => ({ ...prev, price: rawValue }));
    setDisplayPrice(formatNumberDisplay(rawValue));
    if (errors.price) {
      setErrors(prev => ({ ...prev, price: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        ...formData,
        category_id: parseInt(formData.category_id),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        amount: parseFloat(formData.quantity) * parseFloat(formData.price)
      };
      await onSubmit(submitData);
    }
  };

  const totalAmount = formData.quantity && formData.price 
    ? (parseFloat(formData.quantity) * parseFloat(formData.price))
    : 0;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Danh mục <span className="required">*</span>
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className={`form-select ${errors.category_id ? 'error' : ''}`}
            disabled={isLoading}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && <span className="form-error">{errors.category_id}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Loại giao dịch <span className="required">*</span>
          </label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${formData.type === 'buy' ? 'active buy' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'buy' }))}
              disabled={isLoading}
            >
              🟢 Mua
            </button>
            <button
              type="button"
              className={`toggle-btn ${formData.type === 'sell' ? 'active sell' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'sell' }))}
              disabled={isLoading}
            >
              🔴 Bán
            </button>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Số lượng <span className="required">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className={`form-input ${errors.quantity ? 'error' : ''}`}
            placeholder="0.00"
            step="0.000001"
            min="0"
            disabled={isLoading}
          />
          {errors.quantity && <span className="form-error">{errors.quantity}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Giá (VND) <span className="required">*</span>
          </label>
          <input
            type="text"
            name="price"
            value={displayPrice}
            onChange={handlePriceChange}
            className={`form-input ${errors.price ? 'error' : ''}`}
            placeholder="0"
            inputMode="decimal"
            disabled={isLoading}
          />
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Ngày giao dịch <span className="required">*</span>
        </label>
        <input
          type="date"
          name="transaction_date"
          value={formData.transaction_date}
          onChange={handleChange}
          className={`form-input ${errors.transaction_date ? 'error' : ''}`}
          disabled={isLoading}
        />
        {errors.transaction_date && <span className="form-error">{errors.transaction_date}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Ghi chú</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Ghi chú thêm về giao dịch..."
          rows={2}
          disabled={isLoading}
        />
      </div>

      {totalAmount > 0 && (
        <div className="form-summary">
          <span className="summary-label">Tổng giá trị:</span>
          <span className={`summary-value number ${formData.type === 'buy' ? 'buy' : 'sell'}`}>
            {formData.type === 'buy' ? '-' : '+'}{totalAmount.toLocaleString('vi-VN')} VND
          </span>
        </div>
      )}

      <div className="form-actions">
        {onCancel && (
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
        )}
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Đang xử lý...' : (initialData ? 'Cập nhật' : 'Thêm giao dịch')}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
