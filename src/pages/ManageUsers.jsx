import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ManageUsers.css";

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    mobile: "",
    password: ""
  });

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Validation functions
  const validateName = (name) => {
    return name.length >= 3 && name.length <= 50;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.users);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users. Please try again later.");
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));

    // Apply validation based on input field
    switch (name) {
      case "name":
        setErrors({
          ...errors,
          name: validateName(value) ? "" : "Name must be between 3 and 50 characters."
        });
        break;
      case "email":
        setErrors({
          ...errors,
          email: validateEmail(value) ? "" : "Enter a valid email address."
        });
        break;
      case "mobile":
        setErrors({
          ...errors,
          mobile: validateMobile(value) ? "" : "Enter a valid 10-digit mobile number."
        });
        break;
      case "password":
        setErrors({
          ...errors,
          password: validatePassword(value) ? "" : "Password must have 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character."
        });
        break;
      default:
        break;
    }
  };

  const validateForm = () => {
    const nameValid = validateName(newUser.name);
    const emailValid = validateEmail(newUser.email);
    const mobileValid = validateMobile(newUser.mobile);
    const passwordValid = validatePassword(newUser.password);

    setErrors({
      name: nameValid ? "" : "Name must be between 3 and 50 characters.",
      email: emailValid ? "" : "Enter a valid email address.",
      mobile: mobileValid ? "" : "Enter a valid 10-digit mobile number.",
      password: passwordValid ? "" : "Password must have 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character."
    });

    return nameValid && emailValid && mobileValid && passwordValid;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/users", newUser, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Reset form and fetch updated user list
      setNewUser({ name: "", email: "", mobile: "", password: "" });
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      setError("Failed to add user. Please try again.");
      console.error("Error adding user:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // Fetch updated user list
        fetchUsers();
      } catch (err) {
        setError("Failed to delete user. Please try again.");
        console.error("Error deleting user:", err);
      }
    }
  };

  return (
    <div className="manage-users-container">
      <div className="header">
        <h1>Manage Users</h1>
        <div className="actions">
          <button
            className="back-btn"
            onClick={() => navigate('/home')}
          >
            Back to Dashboard
          </button>
          <button
            className="add-user-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add User'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="add-user-form">
          <h2>Add New User</h2>
          <form onSubmit={handleAddUser}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={newUser.mobile}
                onChange={handleInputChange}
                required
              />
              {errors.mobile && <p className="error-text">{errors.mobile}</p>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            <button type="submit" className="submit-btn">Add User</button>
          </form>
        </div>
      )}

      <div className="users-table-container">
        {isLoading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.mobile || 'N/A'}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-users">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;