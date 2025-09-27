// // Calling Packages
// import dotenv from "dotenv"
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser"

// // Routes
// import authRoutes from "./routes/AuthRoutes.js"

// // Db
// import connectDB from "./config/db.js";

// dotenv.config();
// const app = express();


// // Configure CORS properly
// app.use(
//   cors({
//     origin: "http://localhost:5173", // Allow only your frontend URL
//     credentials: true, // Allow cookies, authentication headers
//     methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
//   })
// );


// // Using Express to Handle JSON Response
// app.use(express.json()); // Parses JSON requests
// app.use(cookieParser())


// // Connect to MongoDB
// connectDB();

// // Middleware to Log Requests
// app.use((req, res, next) => {
//   console.log(req.path, req.method);
//   next();
// });

// // Assigning Path to API
// app.use("/api/auth", authRoutes);

// const PORT = 8000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




const express = require("express")
const http = require("http")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const socketIo = require("socket.io")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")

// Load environment variables
dotenv.config()

// Import routes
const authRoutes = require("./routes/AuthRoutes")
// const userRoutes = require("./routes/users")
const messageRoutes = require("./routes/messages")

// Import models
const User = require("./models/UserModel")
const Message = require("./models/Message")

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // Your frontend URLs
  credentials: true, // Allow cookies and credentials
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(express.json())
app.use(cookieParser())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/discord-chat")
  .then(async () => {
    console.log("MongoDB connected");

    // One-time index cleanup: drop old unique index on participants if it exists
    try {
      const DMThread = require("./models/DMThread");
      const dmCollection = mongoose.connection.collection("dmthreads");
      const indexes = await dmCollection.indexes();
      const hasParticipantsUnique = indexes.some(
        (idx) => idx.name === "participants_1" && idx.unique
      );
      if (hasParticipantsUnique) {
        console.log("Dropping old unique index participants_1 on dmthreads...");
        await dmCollection.dropIndex("participants_1");
      }

      // Backfill missing pairKey for existing threads
      const missingPairKey = await DMThread.find({ $or: [{ pairKey: { $exists: false } }, { pairKey: null }] });
      for (const t of missingPairKey) {
        if (Array.isArray(t.participants) && t.participants.length === 2) {
          const sorted = t.participants.map((id) => id.toString()).sort();
          t.pairKey = `${sorted[0]}-${sorted[1]}`;
          await t.save();
        }
      }
    } catch (e) {
      console.warn("Index cleanup warning:", e?.message || e);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
// app.use("/api/users", userRoutes)
app.use("/api/messages", messageRoutes)

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error("Authentication error: Token not provided"))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret")
    socket.userId = decoded.id
    next()
  } catch (error) {
    return next(new Error("Authentication error: Invalid token"))
  }
})

// Socket connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`)

  // Update user status to online
  User.findByIdAndUpdate(socket.userId, { status: "online" })
    .then(() => {
      // Notify other users that this user is online
      socket.broadcast.emit("user_status", {
        userId: socket.userId,
        status: "online",
      })
    })
    .catch((err) => console.error("Error updating user status:", err))

  // Handle messages
  socket.on("message", async (data) => {
    try {
      const { receiver, content } = data

      // Create and save message
      const message = new Message({
        sender: socket.userId,
        receiver,
        content,
      })

      const savedMessage = await message.save()

      // Populate sender info
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate("sender", "username")
        .populate("receiver", "username")

      // Send message to sender and receiver
      io.emit("message", populatedMessage)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  })

  // Handle typing indicator
  socket.on("typing", (data) => {
    const { receiverId, isTyping } = data

    // Emit typing event to the receiver
    socket.broadcast.emit("typing", {
      userId: socket.userId,
      isTyping,
    })
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`)

    // Update user status to offline
    User.findByIdAndUpdate(socket.userId, { status: "offline" })
      .then(() => {
        // Notify other users that this user is offline
        socket.broadcast.emit("user_status", {
          userId: socket.userId,
          status: "offline",
        })
      })
      .catch((err) => console.error("Error updating user status:", err))
  })
})

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Socket.IO server ready for connections`)
})
