import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { MATOMO_CONFIG, buildMatomoUrl, getPeriodByKey } from '../config/matomo';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StatCard = ({ title, value, isLoading, icon, change }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h2>
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse mt-2 rounded-md"></div>
        ) : (
          <div className="mt-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                {change >= 0 ? '↗' : '↘'} {Math.abs(change)}% from last period
              </p>
            )}
          </div>
        )}
      </div>
      {icon && <div className="text-gray-400 text-2xl">{icon}</div>}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-500">Loading analytics data...</span>
  </div>
);

const ErrorAlert = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
    <div className="flex items-center justify-between">
      <div>
        <strong className="font-medium">Error: </strong>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

const fetchMatomoData = async (siteId, period, date, method = MATOMO_CONFIG.endpoints.uniqueVisitors) => {
  try {
    const url = buildMatomoUrl(siteId, period, date, method);
    const response = await axios.get(url, { timeout: MATOMO_CONFIG.timeout });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${method} for site ${siteId}:`, error);
    throw error;
  }
};

const SuperAnalytics = () => {
  const [stats, setStats] = useState({
    chartData: [],
    totalUsers: 0,
    totalSessions: 0,
    pageViews: 0,
    bounceRate: 0,
    siteBreakdown: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const periodObj = getPeriodByKey(selectedPeriod);
      
      // Fetch data for all sites in parallel
      const dataPromises = MATOMO_CONFIG.sites.map(async (site) => {
        const [users, sessions, pageViews] = await Promise.all([
          fetchMatomoData(site.id, periodObj.key, periodObj.date, MATOMO_CONFIG.endpoints.uniqueVisitors),
          fetchMatomoData(site.id, periodObj.key, periodObj.date, MATOMO_CONFIG.endpoints.visits),
          fetchMatomoData(site.id, periodObj.key, periodObj.date, MATOMO_CONFIG.endpoints.actions)
        ]);
        
        return {
          site: site.label,
          siteId: site.id,
          color: site.color,
          users,
          sessions,
          pageViews
        };
      });

      const results = await Promise.all(dataPromises);
      
      // Transform data for charting
      const chartData = [];
      if (results.length > 0 && results[0].users) {
        const dates = Object.keys(results[0].users);
        
        dates.forEach(date => {
          const entry = { date };
          results.forEach(result => {
            entry[`${result.site}_users`] = result.users[date] || 0;
            entry[`${result.site}_sessions`] = result.sessions[date] || 0;
            entry[`${result.site}_pageViews`] = result.pageViews[date] || 0;
          });
          chartData.push(entry);
        });
      }

      // Calculate totals and site breakdown
      let totalUsers = 0;
      let totalSessions = 0;
      let totalPageViews = 0;
      const siteBreakdown = [];

      results.forEach(result => {
        const siteUsers = Object.values(result.users || {}).reduce((sum, val) => sum + (val || 0), 0);
        const siteSessions = Object.values(result.sessions || {}).reduce((sum, val) => sum + (val || 0), 0);
        const sitePageViews = Object.values(result.pageViews || {}).reduce((sum, val) => sum + (val || 0), 0);
        
        totalUsers += siteUsers;
        totalSessions += siteSessions;
        totalPageViews += sitePageViews;
        
        siteBreakdown.push({
          name: result.site,
          users: siteUsers,
          sessions: siteSessions,
          pageViews: sitePageViews,
          color: result.color
        });
      });

      setStats({
        chartData,
        totalUsers,
        totalSessions,
        pageViews: totalPageViews,
        bounceRate: totalSessions > 0 ? Math.round(((totalSessions - totalPageViews) / totalSessions) * 100) : 0,
        siteBreakdown
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to fetch analytics from Matomo. Please check your connection and try again.');
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Monitor your application usage and performance metrics</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onRetry={fetchAllData} />}

        {/* Period Selection */}
        <div className="mb-6">
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200 w-fit">
            {MATOMO_CONFIG.periods.map(p => (
              <button
                key={p.key}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === p.key 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers.toLocaleString()} 
            isLoading={isLoading}
            icon="👥"
          />
          <StatCard 
            title="Total Sessions" 
            value={stats.totalSessions.toLocaleString()} 
            isLoading={isLoading}
            icon="📱"
          />
          <StatCard 
            title="Page Views" 
            value={stats.pageViews.toLocaleString()} 
            isLoading={isLoading}
            icon="👁️"
          />
          <StatCard 
            title="Avg. Pages/Session" 
            value={stats.totalSessions > 0 ? (stats.pageViews / stats.totalSessions).toFixed(1) : '0'} 
            isLoading={isLoading}
            icon="📄"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Unique Users Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Unique Users ({getPeriodByKey(selectedPeriod).label})
            </h2>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis allowDecimals={false} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  {MATOMO_CONFIG.sites.map(site => (
                    <Line 
                      key={site.id} 
                      type="monotone" 
                      dataKey={`${site.label}_users`} 
                      stroke={site.color} 
                      strokeWidth={2}
                      dot={{ fill: site.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: site.color, strokeWidth: 2 }} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Site Breakdown Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Users by Application</h2>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.siteBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="users"
                  >
                    {stats.siteBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sessions Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Sessions Overview ({getPeriodByKey(selectedPeriod).label})
          </h2>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis allowDecimals={false} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                {MATOMO_CONFIG.sites.map(site => (
                  <Bar 
                    key={site.id} 
                    dataKey={`${site.label}_sessions`} 
                    fill={site.color}
                    name={`${site.label} Sessions`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Site Details Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Detailed Metrics by Application</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pages/Session
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : (
                  stats.siteBreakdown.map((site, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3" 
                            style={{ backgroundColor: site.color }}
                          ></div>
                          <div className="text-sm font-medium text-gray-900">{site.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {site.users.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {site.sessions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {site.pageViews.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {site.sessions > 0 ? (site.pageViews / site.sessions).toFixed(1) : '0'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAnalytics;
