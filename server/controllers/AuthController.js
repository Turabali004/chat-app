// import jwt from "jsonwebtoken";
const jwt = require("jsonwebtoken");

// import { compare } from "bcryptjs";
const { compare } = require("bcryptjs");

// models
// import User from "../models/UserModel.js";
const User = require("../models/UserModel.js");

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("email", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // check email is duplicate
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const user = await User.create({ email, password });

    res.cookie("jwt", createToken(email, user._id), {
      maxAge,
      secure: false, // Set to false for localhost
      sameSite: "Lax",
      httpOnly: true,
    });
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User with the given email not found." });
    }

    const auth = await compare(password, user.password);
    if (!auth) {
      return res.status(400).json({ message: "Password is incorrect." });
    }
    res.cookie("jwt", createToken(email, user._id), {
      maxAge,
      secure: false, // Set to false for localhost
      sameSite: "Lax",
      httpOnly: true,
    });
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserInfo = async (req, res, next) => {
  try {
    const userData = await User.findById(req.userId);
    if (!userData) {
      return res.status(404).json({ message: "User with the given id not found." });
    }

    return res.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;
    console.log("firstName:", firstName)


    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "Firstname, Lastname, and color are required." });
    }
    
    

    const userData = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        color,
        profileSetup: true,
      },
      { new: true }
    );

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      color: userData.color,
      image: userData.image,
      profileSetup: userData.profileSetup,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
  getUserInfo,
  updateProfile
};
