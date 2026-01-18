/**
 * Formatter Utilities
 * Single Responsibility: Format data for display
 */

// Format currency (VND)
export const formatCurrency = (value, currency = 'VND') => {
  const num = parseFloat(value) || 0;
  
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Format number with thousand separators
export const formatNumber = (value, decimals = 2) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  const num = parseFloat(value) || 0;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
};

// Format date
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('vi-VN');
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (format === 'datetime') {
    return d.toLocaleString('vi-VN');
  }
  
  return d.toLocaleDateString('vi-VN');
};

// Format quantity
export const formatQuantity = (value) => {
  const num = parseFloat(value) || 0;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  // Làm tròn đến 2 chữ số thập phân
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
};

// Shorten large numbers for charts
export const shortenNumber = (value) => {
  const num = parseFloat(value) || 0;
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
};

// Get PnL color class
export const getPnlClass = (value) => {
  const num = parseFloat(value) || 0;
  if (num > 0) return 'profit';
  if (num < 0) return 'loss';
  return '';
};
