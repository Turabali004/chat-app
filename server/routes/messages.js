const { Router } = require("express");
const {
  getMessages,
  sendMessage,
  getContacts,
  markMessageAsRead,
  getAllUsers
} = require("../controllers/MessageController");
const verifyToken = require("../middlewares/AuthMiddleware");

const messageRoutes = Router();

// All routes require authentication
messageRoutes.use(verifyToken);

// Get messages between current user and another user
messageRoutes.post("/get-messages", getMessages);

// Send a new message
messageRoutes.post("/send-message", sendMessage);

// Get contacts (users you've messaged with)
messageRoutes.get("/contacts", getContacts);

// Get all users for contact search
messageRoutes.get("/all-users", getAllUsers);

// Mark message as read
messageRoutes.patch("/mark-read/:messageId", markMessageAsRead);

module.exports = messageRoutes;