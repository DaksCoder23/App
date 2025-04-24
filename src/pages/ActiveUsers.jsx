import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ActiveUsers.css";

const ActiveUsers = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSignups, setRecentSignups] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const navigate = useNavigate();

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
        
        // Fetch multiple data sources in parallel
        const [statsResponse, signupsResponse, userTypesResponse, platformResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/user-stats", { headers }),
          axios.get("http://localhost:5000/api/recent-signups", { headers }),
          axios.get("http://localhost:5000/api/user-types", { headers }),
          axios.get("http://localhost:5000/api/platform-usage", { headers })
        ]);
        
        setTotalUsers(statsResponse.data.totalUsers);
        setActiveUsers(statsResponse.data.activeUsers);
        setRecentSignups(signupsResponse.data.recentUsers || []);
        setUserTypes(userTypesResponse.data.userTypes || []);
        setPlatformData(platformResponse.data.platformData || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response && error.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          // Redirect to login page after token expires
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError("Failed to load user data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Calculate activity percentage
  const calculateActivityPercentage = (active, total) => {
    return total > 0 ? ((active / total) * 100).toFixed(1) : 0;
  };

  // Generate user avatar initials and color
  const getUserInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const getUserColor = (id) => {
    const colors = [
      "#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", 
      "#3F51B5", "#009688", "#FF5722", "#795548", "#607D8B"
    ];
    return colors[id % colors.length];
  };

  // Truncate email for privacy
  const truncateEmail = (email) => {
    if (!email) return "";
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.substring(0, 3)}...@${domain}`;
  };

  // Navigate back function
  const goBack = () => {
    navigate(-1);
  };

  return (
    
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <a href="#" onClick={goBack} className="back-link">
            <span className="back-icon">&#10094;</span>
          </a>
          <h1 className="dashboard-title">User Analytics Dashboard</h1>
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
          {/* Main Stats Section */}
          <div className="stats-wrapper">
            <div className="stats-container">
              <div className="stat-tile">
                <h2>Total Users</h2>
                <p className="stat-count">{totalUsers}</p>
              </div>
              <div className="stat-tile">
                <h2>Active Users</h2>
                <p className="stat-count">{activeUsers}</p>
                <p className="stat-info">
                  {calculateActivityPercentage(activeUsers, totalUsers)}% of total
                </p>
              </div>
            </div>
          </div>

          
          {/* Tables Container */}
          <div className="tables-container">
            

            {/* Recent Signups */}
            <div className="table-section">
              <h2 className="section-title">Recent Signups</h2>
              {recentSignups.length > 0 ? (
                <table className="user-stats-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSignups.map((user, index) => (
                      <tr key={index}>
                        <td className="user-name">
                          <div 
                            className="user-avatar" 
                            style={{ backgroundColor: getUserColor(user.id || index) }}
                          >
                            {getUserInitial(user.name)}
                          </div>
                          {user.name}
                        </td>
                        <td className="user-email">{truncateEmail(user.email)}</td>
                        <td>{user.joinDate || "Recently"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No recent signups</p>
              )}
            </div>
          </div>

          {/* Actions section */}
          <div className="actions-panel">
            <div className="quick-actions">
              <button className="action-button">
                <span className="action-icon">📊</span>
                <span>Export User Data</span>
              </button>
              <button className="action-button">
                <span className="action-icon">📧</span>
                <span>Email All Users</span>
              </button>
              <button className="action-button" onClick={() => window.location.reload()}>
                <span className="action-icon">⟳</span>
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;