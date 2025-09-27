const Message = require("../models/Message");
const User = require("../models/UserModel");
const DMThread = require("../models/DMThread");

// helper to normalize pair order (string ObjectId values sorted)
const normalizePair = (a, b) => [a.toString(), b.toString()].sort();

// Get messages between two users (only if request accepted)
const getMessages = async (req, res) => {
  try {
    const { userId, page = 1, limit = 30 } = req.body;
    const currentUserId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const [a, b] = normalizePair(currentUserId, userId);
    const thread = await DMThread.findOne({ pairKey: `${a}-${b}` });

    if (!thread) return res.status(200).json({ messages: [], page: Number(page) });

    if (thread.status !== "accepted") {
      // Hide message content until accepted
      return res.status(403).json({ message: "Message request not accepted yet." });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ thread: thread._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender", "firstName lastName email image color")
      .populate("receiver", "firstName lastName email image color");

    return res.status(200).json({ messages: messages.reverse(), page: Number(page) });
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Send a new message (creates thread if missing and sets to pending)
const sendMessage = async (req, res) => {
  try {
    const { receiver, content, messageType = "text" } = req.body;
    const sender = req.userId;

    if (!receiver || !content) {
      return res.status(400).json({ message: "Receiver and content are required" });
    }

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const [a, b] = normalizePair(sender, receiver);
    let thread = await DMThread.findOne({ pairKey: `${a}-${b}` });

    if (!thread) {
      thread = await DMThread.create({
        participants: [a, b],
        initiator: sender,
        status: "pending",
        lastMessage: content,
        lastMessageAt: new Date(),
      });
    } else {
      // If blocked and not by sender, deny
      if (thread.status === "blocked" && thread.blockedBy?.toString() !== sender.toString()) {
        return res.status(403).json({ message: "You cannot message this user" });
      }
      thread.lastMessage = content;
      thread.lastMessageAt = new Date();
      await thread.save();
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      content,
      messageType,
      thread: thread._id,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "firstName lastName email image color")
      .populate("receiver", "firstName lastName email image color");

    return res.status(201).json({ message: populatedMessage, thread });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Accepted contacts list (threads with status accepted)
const getContacts = async (req, res) => {
  try {
    const userId = req.userId;

    const threads = await DMThread.find({
      participants: userId,
      status: "accepted",
    }).sort({ lastMessageAt: -1 });

    const contacts = await Promise.all(
      threads.map(async (t) => {
        const otherId = t.participants.find((id) => id.toString() !== userId.toString());
        const other = await User.findById(otherId).select("firstName lastName email image color username");
        return {
          ...other.toObject(),
          threadId: t._id,
          lastMessage: t.lastMessage,
          lastMessageTime: t.lastMessageAt,
          unreadCount: 0,
        };
      })
    );

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error getting contacts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Pending message requests for current user
const getRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await DMThread.find({
      participants: userId,
      status: "pending",
    }).sort({ lastMessageAt: -1 });

    const inbound = await Promise.all(
      requests.map(async (t) => {
        const otherId = t.participants.find((id) => id.toString() !== userId.toString());
        const fromUser = await User.findById(t.initiator).select("firstName lastName email image color");
        return {
          threadId: t._id,
          from: fromUser,
          otherUserId: otherId,
          preview: t.lastMessage,
          time: t.lastMessageAt,
        };
      })
    );

    return res.status(200).json({ requests: inbound });
  } catch (error) {
    console.error("Error getting requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.userId;

    const thread = await DMThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    if (!thread.participants.map(String).includes(userId.toString())) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    thread.status = "accepted";
    await thread.save();

    return res.status(200).json({ message: "Request accepted", thread });
  } catch (error) {
    console.error("Error accepting request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.userId;

    const thread = await DMThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    if (!thread.participants.map(String).includes(userId.toString())) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Message.deleteMany({ thread: thread._id });
    await thread.deleteOne();

    return res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Mark message as read (unchanged logic)
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    message.isRead = true;
    await message.save();

    return res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all users for search (unchanged)
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const users = await User.find({
      _id: { $ne: currentUserId },
      profileSetup: true,
    }).select("firstName lastName email image color username");

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Find user by username (case-insensitive exact match)
const findUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;
    const currentUserId = req.userId;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: "username is required" });
    }
    const user = await User.findOne({
      username: username.toLowerCase().trim(),
      _id: { $ne: currentUserId },
      profileSetup: true,
    }).select("firstName lastName email image color username");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error finding user by username:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getContacts,
  getRequests,
  acceptRequest,
  rejectRequest,
  markMessageAsRead,
  getAllUsers,
  findUserByUsername,
};