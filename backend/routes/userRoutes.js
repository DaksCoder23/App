const express = require("express");
const { getAllUsers, addUser, deleteUser } = require("../controllers/userController");
const authenticateToken = require("../middleware/authMiddleware");
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all users
router.get("/", getAllUsers);

// Add a new user
router.post("/", addUser);

// Delete a user
router.delete("/:id", deleteUser);

module.exports = router;