// Matomo Analytics Configuration
export const MATOMO_CONFIG = {
  // Matomo server URL (update this to match your Matomo installation)
  url: 'http://localhost/matomo',
  
  // Authentication token (get this from your Matomo admin panel)
  token: 'a5b8c7c4c08e277f16a3ae7f404788cc',
  
  // Site IDs to track (update these to match your Matomo site IDs)
  sites: [
    { id: 2, label: 'Web User Kiosk', color: '#8884d8' },
    { id: 3, label: 'Kiosk User', color: '#82ca9d' }
  ],
  
  // Available time periods for analytics
  periods: [
    { key: 'day', label: 'Daily', date: 'last7' },
    { key: 'week', label: 'Weekly', date: 'last8' },
    { key: 'month', label: 'Monthly', date: 'last12' },
    { key: 'year', label: 'Yearly', date: 'last5' }
  ],
  
  // API endpoints for different metrics
  endpoints: {
    uniqueVisitors: 'VisitsSummary.getUniqueVisitors',
    visits: 'VisitsSummary.getVisits',
    actions: 'VisitsSummary.getActions',
    bounceRate: 'VisitsSummary.getBounceRate',
    averageTimeOnSite: 'VisitsSummary.getAverageTimeOnSite',
    maxActions: 'VisitsSummary.getMaxActions',
    conversions: 'Goals.get'
  },
  
  // Request timeout in milliseconds
  timeout: 10000,
  
  // Chart colors for multiple sites
  chartColors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe']
};

// Helper function to build Matomo API URL
export const buildMatomoUrl = (siteId, period, date, method) => {
  const { url, token } = MATOMO_CONFIG;
  return `${url}/?module=API&method=${method}&idSite=${siteId}&period=${period}&date=${date}&format=JSON&token_auth=${token}`;
};

// Helper function to get site configuration by ID
export const getSiteById = (siteId) => {
  return MATOMO_CONFIG.sites.find(site => site.id === siteId);
};

// Helper function to get period configuration by key
export const getPeriodByKey = (periodKey) => {
  return MATOMO_CONFIG.periods.find(period => period.key === periodKey);
};