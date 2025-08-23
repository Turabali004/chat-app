const Message = require("../models/Message");
const User = require("../models/UserModel");

// Get messages between two users
const getMessages = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.userId; // From auth middleware

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate("sender", "firstName lastName email")
    .populate("receiver", "firstName lastName email")
    .sort({ timestamp: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const { receiver, content, messageType = "text" } = req.body;
    const sender = req.userId; // From auth middleware

    if (!receiver || !content) {
      return res.status(400).json({ message: "Receiver and content are required" });
    }

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const newMessage = new Message({
      sender,
      receiver,
      content,
      messageType,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "firstName lastName email")
      .populate("receiver", "firstName lastName email");

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user contacts (users you've messaged with)
const getContacts = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .populate("sender", "firstName lastName email image color")
    .populate("receiver", "firstName lastName email image color")
    .sort({ timestamp: -1 });

    // Extract unique contacts
    const contactsMap = new Map();
    
    messages.forEach(message => {
      const contact = message.sender._id.toString() === userId ? message.receiver : message.sender;
      const contactId = contact._id.toString();
      
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          ...contact.toObject(),
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          unreadCount: 0
        });
      }
    });

    const contacts = Array.from(contactsMap.values());
    res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error getting contacts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the receiver can mark the message as read
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all users for contact search
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.userId;
    
    const users = await User.find({ 
      _id: { $ne: currentUserId },
      profileSetup: true 
    }).select("firstName lastName email image color");

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getContacts,
  markMessageAsRead,
  getAllUsers
};