/**
 * External Price Service
 * Lấy giá từ các nguồn bên ngoài
 */
const axios = require('axios');
const FMARKET_PRODUCT_BASE = 'https://api.fmarket.vn/home/product';

const axiosInstance = axios.create({
  timeout: 15000
});

class ExternalPriceService {
  /**
   * Lấy giá quỹ từ Fmarket API: GET https://api.fmarket.vn/home/product/{slug}
   * @param {string} productSlug - slug trên URL (vd: dcds, dcbf, dcip)
   */
  async getFmarketProductPrice(productSlug) {
    const slug = String(productSlug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      throw new Error('Invalid product slug');
    }

    const url = `${FMARKET_PRODUCT_BASE}/${encodeURIComponent(slug)}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const body = response.data;
      if (body.status !== 200 || body.code !== 200 || !body.data) {
        throw new Error(body.message || 'No product data from Fmarket');
      }

      const d = body.data;
      const nav = d.nav != null ? parseFloat(d.nav) : NaN;
      if (Number.isNaN(nav)) {
        throw new Error('NAV not found in Fmarket response');
      }

      let dateStr;
      if (d.extra?.lastNAVDate != null) {
        dateStr = new Date(d.extra.lastNAVDate).toISOString();
      } else if (d.productTradingSession?.tradingTimeString) {
        dateStr = d.productTradingSession.tradingTimeString;
      } else {
        dateStr = new Date().toISOString();
      }

      return {
        price: nav,
        date: dateStr,
        fundCode: d.shortName || slug.toUpperCase(),
        fundSlug: slug,
        source: 'Fmarket'
      };
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error(`Error fetching Fmarket product "${slug}":`, msg);
      throw new Error(`Failed to fetch Fmarket price (${slug}): ${msg}`);
    }
  }

  /**
   * Lấy giá vàng SJC từ vnappmob API
   */
  async getGoldPrice() {
    const url = 'https://www.vang.today/api/prices?type=SJL1L10';

    try {
      const response = await axiosInstance.get(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = response.data;
      
      // Lấy giá từ $.buy
      if (data.buy) {
        const price = data.buy;
        const updated = new Date().toISOString();

        return {
          price: parseFloat(price),
          date: updated,
          type: 'SJC 1L',
          source: 'vang.today'
        };
      }

      throw new Error('No gold price data found in response');
    } catch (error) {
      console.error('Error fetching gold price:', error.message);
      throw new Error(`Failed to fetch gold price: ${error.message}`);
    }
  }

  /**
   * Lấy tỷ giá USD từ Vietcombank API
   */
  async getUSDPrice() {
    // Lấy ngày hiện tại theo format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const url = `https://www.vietcombank.com.vn/api/exchangerates?date=${today}`;

    try {
      const response = await axiosInstance.get(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      // Tìm USD trong mảng Data
      if (data.Data && data.Data.length > 0) {
        const usdData = data.Data.find(item => item.currencyCode === 'USD');
        
        if (usdData) {
          const price = parseFloat(usdData.transfer);
          
          return {
            price: price,
            date: data.UpdatedDate || data.Date,
            currencyCode: 'USD',
            currencyName: usdData.currencyName,
            source: 'Vietcombank'
          };
        }
      }

      throw new Error('No USD price data found in response');
    } catch (error) {
      console.error('Error fetching USD price:', error.message);
      throw new Error(`Failed to fetch USD price: ${error.message}`);
    }
  }

  /**
   * Lấy giá theo fund code
   * Quỹ Fmarket: có thể truyền mã như DCDS hoặc slug URL (dcds, dcbf, …)
   */
  async getPriceByFundCode(fundCode) {
    const raw = String(fundCode || '').trim();
    const upper = raw.toUpperCase();

    switch (upper) {
      case 'DCDS':
        return await this.getFmarketProductPrice('dcds');
      case 'VESAF':
        return await this.getFmarketProductPrice('vesaf');
      case 'GOLD':
      case 'VÀNG':
      case 'SJC':
        return await this.getGoldPrice();
      case 'USD':
      case 'ĐÔ LA':
      case 'ĐÔ LA MỸ':
        return await this.getUSDPrice();
      default: {
        const slug = raw.toLowerCase();
        if (/^[a-z0-9-]+$/.test(slug)) {
          return await this.getFmarketProductPrice(slug);
        }
        throw new Error(`Unsupported fund code: ${fundCode}`);
      }
    }
  }
}

module.exports = new ExternalPriceService();
