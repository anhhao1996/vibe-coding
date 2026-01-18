/**
 * External Price Service
 * Lấy giá từ các nguồn bên ngoài
 */
const axios = require('axios');
const https = require('https');

// Tạo axios instance bỏ qua SSL verification (cho Dragon Capital)
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  timeout: 15000
});

class ExternalPriceService {
  /**
   * Lấy giá DCDS từ Dragon Capital API
   */
  async getDCDSPrice() {
    const now = new Date();
    const endDate = now.toISOString();
    
    // 3 ngày trước
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 3);
    const startDateStr = startDate.toISOString().split('T')[0];

    const params = {
      endDateIsoString: endDate,
      fundCode: "VF1",
      fundReportCode: "DCDS",
      orderBy: "navDate__c",
      orderDirection: "desc",
      pageNumber: 1,
      pageSize: 30,
      siteId: "0DMJ2000000oLukOAE",
      startDateIsoString: startDateStr
    };

    const url = `https://www.dragoncapital.com.vn/individual/vi/webruntime/api/apex/execute?cacheable=true&classname=%40udd%2F01pJ2000000CgSu&isContinuation=false&method=getFundRelatedDataByDateRange&namespace=&params=${encodeURIComponent(JSON.stringify(params))}&language=vi&asGuest=true&htmlEncode=false`;

    try {
      const response = await axiosInstance.get(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      // Lấy giá từ $.returnValue[0].navPerShare__c
      if (data.returnValue && data.returnValue.length > 0) {
        const price = data.returnValue[0].navPerShare__c;
        const navDate = data.returnValue[0].navDate__c;
        
        return {
          price: parseFloat(price),
          date: navDate,
          fundCode: 'DCDS',
          source: 'Dragon Capital'
        };
      }

      throw new Error('No price data found in response');
    } catch (error) {
      console.error('Error fetching DCDS price:', error.message);
      throw new Error(`Failed to fetch DCDS price: ${error.message}`);
    }
  }

  /**
   * Lấy giá vàng SJC từ vnappmob API
   */
  async getGoldPrice() {
    const url = 'https://api.vnappmob.com/api/v2/gold/sjc';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Njk4NTY0NDYsImlhdCI6MTc2ODU2MDQ0Niwic2NvcGUiOiJnb2xkIiwicGVybWlzc2lvbiI6MH0.IYX73j1nf70fWiMbshAlYhUBZbMxatzaDu-_aPgX-kM';

    try {
      const response = await axiosInstance.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data;
      
      // Lấy giá từ $.results[0].buy_1l
      if (data.results && data.results.length > 0) {
        const price = data.results[0].buy_1l;
        const updated = data.results[0].updated || new Date().toISOString();
        
        return {
          price: parseFloat(price),
          date: updated,
          type: 'SJC 1L',
          source: 'vnappmob'
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
   */
  async getPriceByFundCode(fundCode) {
    switch (fundCode.toUpperCase()) {
      case 'DCDS':
        return await this.getDCDSPrice();
      case 'GOLD':
      case 'VÀNG':
      case 'SJC':
        return await this.getGoldPrice();
      case 'USD':
      case 'ĐÔ LA':
      case 'ĐÔ LA MỸ':
        return await this.getUSDPrice();
      default:
        throw new Error(`Unsupported fund code: ${fundCode}`);
    }
  }
}

module.exports = new ExternalPriceService();
