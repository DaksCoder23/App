const bcrypt = require("bcryptjs");
const db = require("../config/db");

// Get all users
exports.getAllUsers = (req, res) => {
  // Get current user's ID from JWT
  const currentUserId = req.user.id;
  
  // Query to get all users except sensitive fields like password
  const query = "SELECT id, name, email, mobile FROM users";
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Error retrieving users" });
    }
    
    res.status(200).json({ users: results });
  });
};

// Add a new user
exports.addUser = async (req, res) => {
  const { name, email, mobile, password } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  
  try {
    // Check if user already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Error checking for existing user" });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      // Hash the password before saving to DB
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user into DB
      const query = "INSERT INTO users (name, email, mobile, password) VALUES (?, ?, ?, ?)";
      db.query(query, [name, email, mobile, hashedPassword], (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Error creating user" });
        }
        
        res.status(201).json({ 
          message: "User created successfully",
          userId: results.insertId
        });
      });
    });
  } catch (err) {
    console.error("Error in user creation:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a user
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  
  // Basic validation
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  
  // Delete user from DB
  const query = "DELETE FROM users WHERE id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Error deleting user" });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ message: "User deleted successfully" });
  });
};