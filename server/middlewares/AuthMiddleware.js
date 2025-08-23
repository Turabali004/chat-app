// import jwt from "jsonwebtoken";

// export const verifyToken = (req, res, next) => {
//   console.log("token: ", req.cookies);
//   const token = req.cookies.jwt;
//   if (!token) return res.status(401).send("You are not authenticated!");
//   jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
//     if (err) return res.status(403).send("Token is not valid!");
//     req.userId = payload.userId;
//     next();
//   });
// };
 


const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  // Get token from cookies first, then from header
  let token = req.cookies?.jwt || req.header("Authorization")?.replace("Bearer ", "")

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" })
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Add user from payload
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}
