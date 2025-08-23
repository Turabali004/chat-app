import express from "express";
import cors from "cors";
import mongoose from "mongoose";
const app = express();
const port = 3000;
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { schema } from "./graphql/schema/schema.js";
import { getAllUsers } from "./controllers/user.js";
import User from "./model/User.js";

// Enable CORS for all routes

// MongoDB connection
const mongoURI =
  "mongodb+srv://turabalidev004:lnMHKFm2xLEIELhk@cluster0.h9pby.mongodb.net/"; // Replace with your MongoDB URI
mongoose
  .connect(mongoURI, {})
  .then((database) => {
    // console.log(database);
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.use(cors());

// const server = new ApolloServer({
//   typeDefs: schema,
//   resolvers: {
//     Query: {
//       hello: () => "Hello",
//       world: () => "World",
//     },
//   },
// });
const server = new ApolloServer({
  // typeDefs: schema,
  typeDefs: `
  type Users {
    _id: String,
    username: String,
    email: String,
    password: String,
    status: String
  }
  type Query {
    Users: [Users]
  }
  `,

  resolvers: {
    Query: {
      Users: () => {
        return getAllUsers();
      },
    },
  },
});

startStandaloneServer(server, {
  listen: {
    port,
  },
})
  .then(() => {
    console.log(`Server running at http://localhost:${port}`);
  })
  .catch((err) => {
    console.error(err);
  });

// // Basic route
// app.get('/', (req, res) => {
//     res.send("Hello world123");
// });

// Start the server
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });
