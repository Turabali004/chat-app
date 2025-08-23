
// Routes
// import { Router } from "express";
const { Router } = require("express");
// import { signup, login, getUserInfo, updateProfile } from "../controllers/AuthController.js";
const { signup, login, getUserInfo, updateProfile } = require("../controllers/AuthController.js");

// Middle-Ware
// import { verifyToken } from "../middlewares/AuthMiddleware.js";
const verifyToken = require("../middlewares/AuthMiddleware.js");





const authRoutes = Router()


authRoutes.post("/signup", signup)
authRoutes.post("/login", login)
authRoutes.post("/user-info", verifyToken, getUserInfo)
authRoutes.post("/update-profile", verifyToken, updateProfile)




module.exports = authRoutes;
