const { Router } = require("express");
const {
  getMessages,
  sendMessage,
  getContacts,
  getRequests,
  acceptRequest,
  rejectRequest,
  markMessageAsRead,
  getAllUsers,
  findUserByUsername,
} = require("../controllers/MessageController");
const verifyToken = require("../middlewares/AuthMiddleware");

const messageRoutes = Router();

// All routes require authentication
messageRoutes.use(verifyToken);

// Messages between current user and another user
messageRoutes.post("/get-messages", getMessages);

// Send a new message (creates/updates thread)
messageRoutes.post("/send-message", sendMessage);

// Accepted contacts
messageRoutes.get("/contacts", getContacts);

// Message requests
messageRoutes.get("/requests", getRequests);
messageRoutes.post("/requests/:threadId/accept", acceptRequest);
messageRoutes.post("/requests/:threadId/reject", rejectRequest);

// Search users
messageRoutes.get("/all-users", getAllUsers);
messageRoutes.get("/find-by-username", findUserByUsername);

// Read receipts
messageRoutes.patch("/mark-read/:messageId", markMessageAsRead);

module.exports = messageRoutes;