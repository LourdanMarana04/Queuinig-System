import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MATOMO_URL = 'http://localhost/matomo';
const MATOMO_TOKEN = 'a5b8c7c4c08e277f16a3ae7f404788cc';
const SITE_IDS = [
  { id: 2, label: 'Web User Kiosk' },
  { id: 3, label: 'Kiosk User' }
];
const PERIODS = [
  { key: 'day', label: 'Daily', date: 'last7' },
  { key: 'week', label: 'Weekly', date: 'last8' },
  { key: 'month', label: 'Monthly', date: 'last12' },
  { key: 'year', label: 'Yearly', date: 'last5' }
];

const StatCard = ({ title, value, isLoading }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold text-gray-600">{title}</h2>
    {isLoading ? (
      <div className="h-10 w-24 bg-gray-200 animate-pulse mt-2 rounded-md"></div>
    ) : (
      <p className="text-3xl font-bold text-blue-500 mt-2">{value}</p>
    )}
  </div>
);

const fetchMatomoUsers = async (siteId, period, date) => {
  const url = `${MATOMO_URL}/?module=API&method=VisitsSummary.getUniqueVisitors&idSite=${siteId}&period=${period}&date=${date}&format=JSON&token_auth=${MATOMO_TOKEN}`;
  const response = await axios.get(url);
  return response.data;
};

const AnalyticsAdmin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const periodObj = PERIODS.find(p => p.key === selectedPeriod);
        const promises = SITE_IDS.map(async (site) => {
          const data = await fetchMatomoUsers(site.id, periodObj.key, periodObj.date);
          return { site: site.label, data };
        });
        const results = await Promise.all(promises);
        // Transform data for charting
        const chartData = [];
        const keys = Object.keys(results[0].data);
        keys.forEach((date, idx) => {
          const entry = { date };
          results.forEach(r => {
            entry[r.site] = r.data[date];
          });
          chartData.push(entry);
        });
        setStats({ chartData });
      } catch (err) {
        setError('Failed to fetch analytics from Matomo.');
      }
      setIsLoading(false);
    };
    fetchAll();
  }, [selectedPeriod]);

  // Function to handle the back button click
  const handleBack = () => {
    navigate('/dashboard'); // Redirect to the dashboard page
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Department Analytics</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      <div className="mb-4 flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`px-4 py-2 rounded ${selectedPeriod === p.key ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            onClick={() => setSelectedPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Unique Users ({PERIODS.find(p => p.key === selectedPeriod).label})</h2>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {SITE_IDS.map(site => (
                <Line key={site.id} type="monotone" dataKey={site.label} stroke={site.id === 2 ? '#8884d8' : '#82ca9d'} activeDot={{ r: 8 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsAdmin;