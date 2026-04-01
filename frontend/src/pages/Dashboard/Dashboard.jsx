/**
 * Dashboard Page
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StatCard, 
  PortfolioBarChart, 
  PortfolioLineChart, 
  PnL7Days, 
  PnLTable,
  NetWorthCard,
  AssetAllocationChart,
  SavingsTable
} from '../../components/Dashboard';
import { portfolioApi, categoryApi, priceApi, savingsApi } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [savingsBooks, setSavingsBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashResponse, savingsResponse] = await Promise.all([
        portfolioApi.getDashboard(),
        savingsApi.getAll()
      ]);
      setDashboardData(dashResponse.data);
      setSavingsBooks(savingsResponse.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSnapshot = async () => {
    setSavingSnapshot(true);
    try {
      await portfolioApi.createSnapshot();
      alert('✅ Đã lưu snapshot hôm nay!\n\nDữ liệu PnL và biểu đồ lịch sử sẽ được cập nhật.');
      fetchDashboard();
    } catch (err) {
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Kiểm tra category type
  const isDCDSCategory = (categoryName) => {
    return categoryName?.toUpperCase().includes('DCDS');
  };

  const isVESAFCategory = (categoryName) => {
    return categoryName?.toUpperCase().includes('VESAF');
  };

  const isGoldCategory = (categoryName) => {
    const name = categoryName?.toUpperCase() || '';
    return name.includes('VÀNG') || name.includes('VANG') || name.includes('GOLD') || name.includes('SJC');
  };

  const isUSDCategory = (categoryName) => {
    const name = categoryName?.toUpperCase() || '';
    return name.includes('USD') || name.includes('ĐÔ LA') || name.includes('DO LA') || name.includes('DOLLAR');
  };

  // Cập nhật giá toàn bộ và làm mới dashboard
  const refreshWithPriceUpdate = async () => {
    setRefreshing(true);
    
    try {
      // Lấy danh sách categories
      const categoriesResponse = await categoryApi.getAll();
      const categories = categoriesResponse.data || [];

      // Cập nhật giá cho từng category có API
      for (const category of categories) {
        if (parseFloat(category.quantity) <= 0) continue;

        try {
          if (isVESAFCategory(category.name)) {
            await priceApi.updateCategoryWithFmarket(category.id, 'vesaf');
          } else if (isDCDSCategory(category.name)) {
            await priceApi.updateCategoryWithFmarket(category.id, 'dcds');
          } else if (isGoldCategory(category.name)) {
            await priceApi.updateCategoryWithGold(category.id);
          } else if (isUSDCategory(category.name)) {
            await priceApi.updateCategoryWithUSD(category.id);
          }
        } catch (err) {
          console.error(`Failed to update ${category.name}:`, err.message);
        }
      }

      // Sau khi cập nhật giá xong, reload dashboard
      await fetchDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan danh mục đầu tư của bạn</p>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>Không thể tải dữ liệu: {error}</p>
          <button className="btn btn-primary" onClick={fetchDashboard}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const { overview, distribution, pnlByCategory, pnl7Days, portfolioHistory } = dashboardData || {};

  const investmentValue = parseFloat(overview?.total_value) || 0;
  const investmentPnl = parseFloat(overview?.total_pnl) || 0;
  const savingsBalance = savingsBooks.reduce((sum, b) => sum + parseFloat(b.balance || 0), 0);
  const savingsInterest = savingsBooks.reduce((sum, b) => sum + parseFloat(b.total_interest || 0), 0);
  const savingsDeposited = savingsBooks.reduce((sum, b) => sum + parseFloat(b.total_deposited || 0), 0);
  const savingsWithdrawn = savingsBooks.reduce((sum, b) => sum + parseFloat(b.total_withdrawn || 0), 0);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Tổng quan tài sản của bạn</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={createSnapshot}
            disabled={savingSnapshot}
          >
            {savingSnapshot ? '⏳ Đang lưu...' : '📸 Lưu Snapshot'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={refreshWithPriceUpdate}
            disabled={refreshing}
          >
            {refreshing ? '⏳ Đang cập nhật...' : '🔄 Làm mới'}
          </button>
        </div>
      </div>

      {/* Net Worth Hero Card */}
      <NetWorthCard
        investmentValue={investmentValue}
        savingsBalance={savingsBalance}
        investmentPnl={investmentPnl}
        savingsInterest={savingsInterest}
      />

      {/* Investment Stats */}
      <section className="stats-section">
        <h3 className="section-label">💰 Đầu tư</h3>
        <div className="stats-grid">
          <StatCard
            title="Tổng đầu tư"
            value={overview?.total_invested || 0}
            icon="💰"
            type="currency"
          />
          <StatCard
            title="Tổng đã bán"
            value={overview?.total_sold || 0}
            icon="💵"
            type="currency"
            colorClass="sold"
          />
          <StatCard
            title="Giá trị hiện tại"
            value={overview?.total_value || 0}
            icon="📊"
            type="currency"
          />
          <StatCard
            title="Lãi/Lỗ đầu tư"
            value={overview?.total_pnl || 0}
            icon={overview?.total_pnl >= 0 ? "📈" : "📉"}
            type="currency"
            colorClass={overview?.total_pnl >= 0 ? 'profit' : 'loss'}
            trend={overview?.total_pnl >= 0 ? 'up' : 'down'}
            trendValue={overview?.total_pnl_percentage || 0}
          />
        </div>
      </section>

      {/* Savings Stats */}
      {savingsBooks.length > 0 && (
        <section className="stats-section">
          <h3 className="section-label">🏦 Tiết kiệm</h3>
          <div className="stats-grid stats-grid-savings">
            <StatCard
              title="Tổng số dư"
              value={savingsBalance}
              icon="🏦"
              type="currency"
              colorClass="savings"
            />
            <StatCard
              title="Tổng đã nạp"
              value={savingsDeposited}
              icon="📥"
              type="currency"
            />
            <StatCard
              title="Tổng rút ra"
              value={savingsWithdrawn}
              icon="📤"
              type="currency"
              colorClass="sold"
            />
            <StatCard
              title="Lãi đã nhận"
              value={savingsInterest}
              icon="📈"
              type="currency"
              colorClass="profit"
            />
          </div>
        </section>
      )}

      {/* Charts Section */}
      <section className="charts-section">
        <div className="charts-grid">
          <AssetAllocationChart investments={distribution || []} />
          <PortfolioBarChart data={savingsBooks} />
          <PnL7Days data={pnl7Days} />
          <PortfolioLineChart data={portfolioHistory} days={30} />
        </div>
      </section>

      {/* Tables Section */}
      <section className="tables-section">
        <div className="tables-grid">
          <PnLTable data={pnlByCategory} />
          <SavingsTable data={savingsBooks} />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
