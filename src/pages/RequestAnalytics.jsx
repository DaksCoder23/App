// RequestAnalytics.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RequestAnalytics.css";

const RequestAnalytics = () => {
  const [requestStats, setRequestStats] = useState({
    totalRequests: 0,
    byEndpoint: {},
    byMethod: {},
    lastReset: null
  });
  const [messageStats, setMessageStats] = useState({
    topMessageSenders: [],
    topChatParticipants: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }
        
        const headers = {
          Authorization: `Bearer ${token}`
        };
        
        // Fetch request stats and message stats
        const [requestResponse, messageResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/request-stats", { headers }),
          axios.get("http://localhost:5000/api/message-stats", { headers })
        ]);
        
        setRequestStats(requestResponse.data);
        setMessageStats(messageResponse.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response && error.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          // Redirect to login page after token expires
          localStorage.removeItem('token');
          setTimeout(() => window.location.href = '/', 2000);
        } else {
          setError("Failed to load analytics data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling to update stats periodically
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Reset request stats
  const handleReset = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.post("http://localhost:5000/api/reset-request-stats", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the stats
      window.location.reload();
    } catch (error) {
      console.error("Error resetting stats:", error);
      setError("Failed to reset stats");
    }
  };

  // Format the last reset date
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Create method list
  const methodList = Object.entries(requestStats.byMethod || {})
    .sort((a, b) => b[1] - a[1]); // Sort by count in descending order

  // Truncate email for privacy
  const truncateEmail = (email) => {
    if (!email) return "";
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.substring(0, 3)}...@${domain}`;
  };

  // Generate random color based on user ID
  const getUserColor = (id) => {
    const colors = [
      "#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", 
      "#3F51B5", "#009688", "#FF5722", "#795548", "#607D8B"
    ];
    
    // Use modulo to get a predictable color based on ID
    return colors[id % colors.length];
  };

  // Navigate back function
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a href="#" onClick={goBack} className="back-link">
            <span className="back-icon">&#10094;</span>
          </a>
          <h1 className="dashboard-title">User Activity Analytics</h1>
        </div>
        
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <div className="dashboard-panel">
          {/* Stats section */}
          <div className="stats-wrapper">
            <div className="stats-container">
              {/* Main Stats */}
              <div className="stat-tile">
                <h2>Total Requests</h2>
                <p className="stat-count">{requestStats.totalRequests}</p>
                <p className="stat-info">Since {formatDate(requestStats.lastReset)}</p>
              </div>

              {/* Method Distribution */}
              <div className="method-stats-container">
                <h3 className="method-stats-title">Requests by HTTP Method</h3>
                <div className="method-stats">
                  {methodList.map(([method, count], index) => (
                    <div key={index} className="method-stat-item">
                      <div className={`method-badge method-${method.toLowerCase()}`}>{method}</div>
                      <div className="method-count">{count}</div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${(count / requestStats.totalRequests) * 100}%`,
                            backgroundColor: method === 'GET' ? '#4CAF50' : 
                                              method === 'POST' ? '#2196F3' : 
                                              method === 'PUT' ? '#FF9800' :
                                              method === 'DELETE' ? '#F44336' : '#9C27B0'
                          }}
                        ></div>
                      </div>
                      <p className="progress-percentage">
                        {((count / requestStats.totalRequests) * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User tables section */}
          <div className="tables-container">
            {/* Top Message Senders */}
            <div className="table-section">
              <h2 className="section-title">Top Message Senders</h2>
              {messageStats.topMessageSenders.length > 0 ? (
                <table className="user-stats-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Messages Sent</th>
                      <th>Activity Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messageStats.topMessageSenders.map((user, index) => (
                      <tr key={index}>
                        <td className="user-name">
                          <div 
                            className="user-avatar" 
                            style={{ backgroundColor: getUserColor(user.id) }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </td>
                        <td className="user-email">{truncateEmail(user.email)}</td>
                        <td className="user-count">{user.count}</td>
                        <td className="user-activity">
                          <div className="activity-bar">
                            <div 
                              className="activity-fill"
                              style={{ 
                                width: `${Math.min((user.count / messageStats.topMessageSenders[0].count) * 100, 100)}%`,
                                backgroundColor: getUserColor(user.id)
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No message data available</p>
              )}
            </div>

            {/* Top Chat Participants */}
            <div className="table-section">
              <h2 className="section-title">Most Active Chat Users</h2>
              {messageStats.topChatParticipants.length > 0 ? (
                <table className="user-stats-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Conversations</th>
                      <th>Activity Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messageStats.topChatParticipants.map((user, index) => (
                      <tr key={index}>
                        <td className="user-name">
                          <div 
                            className="user-avatar" 
                            style={{ backgroundColor: getUserColor(user.id) }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </td>
                        <td className="user-email">{truncateEmail(user.email)}</td>
                        <td className="user-count">{user.count}</td>
                        <td className="user-activity">
                          <div className="activity-bar">
                            <div 
                              className="activity-fill"
                              style={{ 
                                width: `${Math.min((user.count / messageStats.topChatParticipants[0].count) * 100, 100)}%`,
                                backgroundColor: getUserColor(user.id)
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No conversation data available</p>
              )}
            </div>
          </div>

          {/* Actions section */}
          <div className="actions-panel">
            <div className="quick-actions">
              <button className="action-button" onClick={() => window.location.reload()}>
                <span className="action-icon">⟳</span>
                <span>Refresh Data</span>
              </button>
              <button className="action-button primary" onClick={handleReset}>
                <span className="action-icon">🔄</span>
                <span>Reset Stats</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestAnalytics;