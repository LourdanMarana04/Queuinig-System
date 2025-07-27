# Matomo Analytics Setup Guide

## Overview
The analytics dashboard provides comprehensive insights into your application usage through Matomo integration. It tracks users, sessions, page views, and other key metrics across your applications.

## Configuration

### 1. Update Matomo Settings
Edit `src/config/matomo.js` to match your Matomo installation:

```javascript
export const MATOMO_CONFIG = {
  // Update this to your Matomo server URL
  url: 'http://localhost/matomo',
  
  // Get this from Matomo > Administration > Personal > Security > Auth tokens
  token: 'your-auth-token-here',
  
  // Update site IDs and labels to match your Matomo sites
  sites: [
    { id: 2, label: 'Web User Kiosk', color: '#8884d8' },
    { id: 3, label: 'Kiosk User', color: '#82ca9d' }
  ],
  
  // Customize time periods as needed
  periods: [
    { key: 'day', label: 'Daily', date: 'last7' },
    { key: 'week', label: 'Weekly', date: 'last8' },
    { key: 'month', label: 'Monthly', date: 'last12' },
    { key: 'year', label: 'Yearly', date: 'last5' }
  ]
};
```

### 2. Getting Your Auth Token
1. Log into your Matomo dashboard
2. Go to Administration → Personal → Security
3. Create a new Auth Token or use an existing one
4. Copy the token and update the `token` field in the configuration

### 3. Finding Site IDs
1. In Matomo, go to Administration → Websites → Manage
2. Note the site IDs for the applications you want to track
3. Update the `sites` array in the configuration with the correct IDs and labels

## Features

### Dashboard Components
- **Statistics Cards**: Overview of total users, sessions, page views, and pages per session
- **Line Chart**: Unique users over time for each application
- **Pie Chart**: User distribution across applications
- **Bar Chart**: Session overview by application
- **Data Table**: Detailed metrics breakdown by application

### Time Periods
- Daily (last 7 days)
- Weekly (last 8 weeks)
- Monthly (last 12 months)
- Yearly (last 5 years)

### Error Handling
- Automatic retry functionality
- Connection timeout handling
- User-friendly error messages
- Loading states for all components

## Troubleshooting

### Common Issues

1. **"Failed to fetch analytics"**
   - Check if Matomo server is running and accessible
   - Verify the URL in the configuration
   - Ensure the auth token is valid

2. **Empty or missing data**
   - Verify site IDs match your Matomo installation
   - Check if the sites have recorded data for the selected period
   - Ensure tracking code is properly installed on your applications

3. **CORS errors**
   - Configure Matomo to allow cross-origin requests from your frontend domain
   - Add appropriate CORS headers in your Matomo configuration

### Testing
Test the analytics dashboard by:
1. Ensuring Matomo is accessible at the configured URL
2. Verifying API endpoints work by testing them directly
3. Checking browser console for any error messages

## API Endpoints Used
The dashboard uses these Matomo API methods:
- `VisitsSummary.getUniqueVisitors` - Unique visitors count
- `VisitsSummary.getVisits` - Total visits/sessions
- `VisitsSummary.getActions` - Page views/actions
- `VisitsSummary.getBounceRate` - Bounce rate (if needed)

## Adding More Sites
To track additional applications:
1. Add the new site to Matomo
2. Note the site ID
3. Add a new entry to the `sites` array in the configuration:
```javascript
{ id: 4, label: 'New Application', color: '#ff7300' }
```

The dashboard will automatically include the new site in all charts and calculations.