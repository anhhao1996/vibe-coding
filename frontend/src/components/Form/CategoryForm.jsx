/**
 * Category Form Component - Tạo/Sửa danh mục đầu tư
 */
import React, { useState, useEffect } from 'react';
import './Form.css';

const PRESET_COLORS = [
  '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',
  '#2196F3', '#42A5F5', '#64B5F6',
  '#FF9800', '#FFA726', '#FFB74D',
  '#9C27B0', '#AB47BC', '#BA68C8',
  '#F44336', '#EF5350', '#E57373',
  '#00BCD4', '#26C6DA', '#4DD0E1'
];

const CategoryForm = ({ 
  onSubmit, 
  initialData = null, 
  isLoading = false,
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4CAF50'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        color: initialData.color || '#4CAF50'
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Tên danh mục không được để trống';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Tên danh mục phải có ít nhất 2 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">
          Tên danh mục <span className="required">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="VD: Cổ phiếu, Vàng, Bitcoin..."
          disabled={isLoading}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Mô tả</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Mô tả về danh mục đầu tư..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Màu đại diện</label>
        <div className="color-picker">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`color-option ${formData.color === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              disabled={isLoading}
            />
          ))}
        </div>
        <input
          type="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
          className="color-input"
          disabled={isLoading}
        />
      </div>

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
          {isLoading ? 'Đang xử lý...' : (initialData ? 'Cập nhật' : 'Tạo mới')}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
