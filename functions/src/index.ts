import express from "express";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
admin.initializeApp();

// Import API routes
import usersRouter from "./api/users";
import submissionsRouter from "./api/submissions";
import challengesRouter from "./api/challenges";
import leaderboardRouter from "./api/leaderboard";
import authRouter from "./api/auth";

// Initialize Express App
const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use("/users", usersRouter);
app.use("auth",authRouter);
app.use("/submissions", submissionsRouter);
app.use("/challenges", challengesRouter);
app.use("/leaderboard", leaderboardRouter);

// Export Express App as a Firebase Cloud Function
export const api = functions.https.onRequest(app);
