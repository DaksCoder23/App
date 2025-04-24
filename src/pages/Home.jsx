import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaUsers, 
  FaServer, 
  FaChartLine, 
  FaEnvelope, 
  FaSignOutAlt, 
  FaUserCog, 
  FaInfoCircle, 
  FaFeatherAlt 
} from "react-icons/fa";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [totalRes, activeRes, requestRes] = await Promise.all([
          axios.get("/api/users/count"),
          axios.get("/api/active-users-count"),
          axios.get("/api/request-count"),
        ]);

        setTotalUsers(totalRes.data.totalUsers);
        setActiveUsers(activeRes.data.activeUsers);
        setRequestCount(requestRes.data.totalRequests);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
    
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleManageUsers = () => {
    navigate("/manage-users");
  };

  return (
    <div className="home-container">
      {/* Sidebar */}
      <aside className="sidebar">
      <div className="logo-container">
        <img src="/Chirp-Logo.png" alt="Chirp Logo" className="logo" />
      </div>
        
        <div className="sidebar-nav">
          <a href="#" className="sidebar-nav-item active">
            <FaChartLine className="sidebar-icon" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="sidebar-nav-item">
            <FaUsers className="sidebar-icon" />
            <span>Users</span>
          </a>
          <a 
            className="sidebar-nav-item" 
            onClick={() => navigate("/messages")}
          >
            <FaEnvelope className="sidebar-icon" />
            <span>Messages</span>
          </a>
        </div>
        
        <div className="manage-user-wrapper">
          <div className="manage-user-tooltip">Manage Users</div>
          <button className="manage-user-btn" onClick={handleManageUsers}>
            <FaUserCog className="button-icon" />
            
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Navbar */}
        <nav className="navbar">
          <ul>
            <li><a href="#about"><FaInfoCircle className="nav-icon" /> About</a></li>
            <li>
              <a onClick={() => navigate("/messages")} style={{ cursor: "pointer" }}>
                <FaEnvelope className="nav-icon" /> Messages
              </a>
            </li>
          </ul>
          
          <div className="logout-wrapper">
            <div className="logout-tooltip">Logout</div>
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt className="logout-icon" />
            </button>
          </div>
        </nav>

        {/* Tiles Section */}
        <div className="tiles-container">
          <div className="tile" onClick={() => navigate("/active-users")}>
            <FaUsers className="tile-icon" />
            <h3 className="tile-title">Active Users</h3>
            <p className="tile-value">{activeUsers}</p>
            <p className="tile-description">Current active users</p>
          </div>
          
          <div className="tile" onClick={() => navigate("/request-analytics")}>
            <FaServer className="tile-icon" />
            <h3 className="tile-title">Server Requests</h3>
            <p className="tile-value">{requestCount}</p>
            <p className="tile-description">Total API requests</p>
          </div>
          
          <div className="tile">
            <FaChartLine className="tile-icon" />
            <h3 className="tile-title">Analytics</h3>
            <p className="tile-value">87%</p>
            <p className="tile-description">System performance</p>
          </div>
          
          <div className="tile">
            <FaEnvelope className="tile-icon" />
            <h3 className="tile-title">Messages</h3>
            <p className="tile-value">24</p>
            <p className="tile-description">Unread messages</p>
          </div>
        </div>
        
        <div className="wave-footer"></div>
      </div>
    </div>
  );
};

export default Home;