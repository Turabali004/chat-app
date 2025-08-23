// import mongoose from "mongoose";
const mongoose = require("mongoose");
// import { genSalt, hash } from "bcryptjs";
const { genSalt, hash } = require("bcryptjs");
// import { genSalt, hash } from "bcryptjs";

const UserSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: false, 
  },
  lastName: { 
    type: String, 
    required: false, 
  },
  email: { 
    type: String, 
    required: [true, "Email is Required."], 
    unique: true,
  },
  password: { 
    type: String, 
    required: [true, "Password is Required"], 
  },
  image : { 
    type: String, 
    required: false,   
  },
  color: {
    type: Number,
    required: false, 
  },
  profileSetup: {
    type: Boolean,
    default: false,
  } 
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
  const salt = await genSalt();
  this.password = await hash(this.password, salt);
  next();
})


const User = mongoose.model("User", UserSchema)
module.exports = User;
