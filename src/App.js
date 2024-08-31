import React, { useState, useEffect } from 'react';
import FacebookLogin from 'react-facebook-login';
import axios from 'axios';
import './App.css';

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageMetrics, setPageMetrics] = useState([]);
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [period, setPeriod] = useState('total_over_range');

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
      fetchUserData(storedAccessToken);
      fetchUserPages(storedAccessToken);
    }
  }, []);

  const handleFacebookLoginResponse = (response) => {
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      setAccessToken(response.accessToken);
      fetchUserData(response.accessToken);
      fetchUserPages(response.accessToken);
    }
  };

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`https://graph.facebook.com/v20.0/me?fields=name,picture&access_token=${token}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserPages = async (token) => {
    try {
      const response = await axios.get(`https://graph.facebook.com/v20.0/me/accounts?access_token=${token}`);
      if (response.data && response.data.data && response.data.data.length > 0) {
        const pagesWithTokens = response.data.data.map(page => ({
          id: page.id,
          name: page.name,
          accessToken: page.access_token,
        }));
        setPages(pagesWithTokens);
      } else {
        setPages([]);
      }
    } catch (error) {
      console.error('Error fetching user pages:', error);
    }
  };

  const handlePageSelect = async (event) => {
    const pageId = event.target.value;
    setSelectedPage(pageId);
    await fetchPageMetrics(pageId, since, until, period);
  };

  const fetchPageMetrics = async (pageId, since, until, period) => {
    try {
      const url = `https://graph.facebook.com/v20.0/${pageId}/insights?metric=page_total_likes,page_engaged_users,page_impressions,page_posts_impressions&since=${since}&until=${until}&period=${period}&access_token=${accessToken}`;
      const response = await axios.get(url);
      setPageMetrics(response.data.data || []);
    } catch (error) {
      console.error('Error fetching page metrics:', error);
    }
  };

  return (
    <div className="container">
      {accessToken ? (
        <div>
          <h2>Logged-in User:</h2>
          <p>{user?.name}</p>
          <img src={user?.picture?.data?.url} alt={user?.name} />

          <h2>Your Pages:</h2>
          <select onChange={handlePageSelect}>
            <option value="">Select a Page</option>
            {pages.length > 0 ? (
              pages.map((page) => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))
            ) : (
              <option disabled>No Pages Available</option>
            )}
          </select>

          {selectedPage && (
            <div>
              <h2>Page Metrics:</h2>
              <div className="metrics">
                {pageMetrics.length > 0 ? (
                  pageMetrics.map((metric, index) => (
                    <div className="metric-card" key={index}>
                      <h3>{metric.name}</h3>
                      <p><strong>Total Followers:</strong> {metric.values[0]?.value}</p>
                      <p><strong>Total Engagement:</strong> {metric.values[1]?.value}</p>
                      <p><strong>Total Impressions:</strong> {metric.values[2]?.value}</p>
                      <p><strong>Total Reactions:</strong> {metric.values[3]?.value}</p>
                    </div>
                  ))
                ) : (
                  <p>No Metrics Available</p>
                )}
              </div>

              <div className="date-range">
                <label htmlFor="since">Since:</label>
                <input type="date" id="since" value={since} onChange={(e) => setSince(e.target.value)} />
                <label htmlFor="until">Until:</label>
                <input type="date" id="until" value={until} onChange={(e) => setUntil(e.target.value)} />
                <label htmlFor="period">Period:</label>
                <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="total_over_range">Total Over Range</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </div>
          )}
        </div>
      ) : (
        <FacebookLogin
          appId="479954958263407"
          autoLoad={true}
          fields="name,email,picture"
          scope="pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_engagement"
          callback={handleFacebookLoginResponse}
        />
      )}
    </div>
  );
}

export default App;
