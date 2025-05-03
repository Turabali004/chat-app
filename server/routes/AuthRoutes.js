import { Router } from "express";

// Routes
import { signup } from "../controllers/AuthController.js";
import { login } from "../controllers/AuthController.js";
import { getUserInfo } from "../controllers/AuthController.js";
import { updateProfile } from "../controllers/AuthController.js";

// Middle-Ware
import { verifyToken } from "../middlewares/AuthMiddleware.js";




const authRoutes = Router()


authRoutes.post("/signup", signup)
authRoutes.post("/login", login)
authRoutes.post("/user-info", verifyToken, getUserInfo)
authRoutes.post("/update-profile", verifyToken, updateProfile)




export default authRoutes;