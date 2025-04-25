import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaComment, FaPlus, FaArrowLeft, FaSyncAlt, FaArrowRight } from 'react-icons/fa';
import './MessageBoard.css';

// Set the base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5000'; 

const MessageBoard = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessageEmail, setNewMessageEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchConversations = async (token) => {
    try {
      console.log('Fetching conversations with token:', token);
      const response = await axios.get('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Conversations response:', response.data);
      
      if (Array.isArray(response.data)) {
        setConversations(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setConversations([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load conversations:', err.response?.data || err.message);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setRefreshing(true);
    await fetchConversations(token);
    setRefreshing(false);
  };

  useEffect(() => {
    // Get current user from local storage
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      navigate('/login');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Fetch conversations
    fetchConversations(token);
    
    // Set up websocket connection
    const setupWebSocket = () => {
      try {
        const ws = new WebSocket('ws://' + window.location.hostname + ':5000');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          // Send authentication
          ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'new_message') {
            // Refresh conversations to update last message
            fetchConversations(token);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        return ws;
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        return null;
      }
    };
    
    const ws = setupWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [navigate]);

  const handleConversationClick = (conversationId) => {
    navigate(`/conversation/${conversationId}`);
  };

  const startNewConversation = async (e) => {
    e.preventDefault();
    
    if (!newMessageEmail.trim()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('Starting conversation with:', newMessageEmail);
      console.log('Using token:', token);
      
      const response = await axios.post('/api/conversations', 
        { recipientEmail: newMessageEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('New conversation response:', response.data);
      
      // Navigate to the new conversation
      if (response.data && response.data.conversationId) {
        navigate(`/conversation/${response.data.conversationId}`);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error creating conversation:', err.response?.data || err.message);
      if (err.response?.status === 404) {
        setError('API endpoint not found. Check your server configuration.');
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        setError('Authentication error. Please log in again.');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to start conversation');
      }
    }
  };

  if (loading) return <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading conversations...</p>
  </div>;
  
  if (error) return <div className="error-container">
    <p className="error-message">{error}</p>
    <button className="action-button" onClick={() => navigate('/home')}>
      <FaArrowLeft size={16} />
      <span>Back to Dashboard</span>
    </button>
  </div>;

  return (
    <div className="message-board-container">
      <div className="header-container">
        <h1>
          <FaComment className="header-icon" size={28} />
          Chirp Messages
        </h1>
        
        <div className="header-actions">
          
          
          <button 
            className="action-button back-button" 
            onClick={() => navigate('/home')}
            title="Back to dashboard"
          >
            <FaArrowLeft size={16} />
            <span className="button-text">Dashboard</span>
          </button>
        </div>
      </div>
      
      <form className="new-conversation-form" onSubmit={startNewConversation}>
        <div className="input-container">
          <input
            type="email"
            placeholder="Enter email to start a new conversation"
            value={newMessageEmail}
            onChange={(e) => setNewMessageEmail(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="submit-button"
            title="Start new conversation"
          >
            <span className="button-text">Start Conversation</span>
            <FaArrowRight size={16} />
          </button>
        </div>
      </form>
      
      <div className="conversation-grid">
        {!Array.isArray(conversations) || conversations.length === 0 ? (
          <div className="no-conversations">
            <FaComment size={42} />
            <p>No conversations yet. Start one by entering an email above!</p>
            <button 
              className="create-first-button" 
              onClick={() => document.querySelector('.new-conversation-form input').focus()}
            >
              <FaPlus size={16} />
              <span>Create your first conversation</span>
            </button>
          </div>
        ) : (
          conversations.map((convo) => (
            <div 
              key={convo._id} 
              className="conversation-tile"
              onClick={() => handleConversationClick(convo._id)}
            >
              <div className="avatar">
                {convo.participant && convo.participant.name ? 
                  convo.participant.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="conversation-info">
                <h3>{convo.participant ? (convo.participant.name || convo.participant.email) : 'Unknown User'}</h3>
                <p className="last-message">
                  {convo.lastMessage?.content || 'No messages yet'}
                </p>
                <p className="timestamp">
                  {convo.lastMessage?.createdAt ? 
                    new Date(convo.lastMessage.createdAt).toLocaleString() : ''}
                </p>
              </div>
              {convo.unreadCount > 0 && 
                <span className="unread-badge">{convo.unreadCount}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageBoard;