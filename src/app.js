import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//app.use syntax is use for middleware

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
); //apply cors

app.use(
  express.json({
    limit: "16kb",
  })
); //to handle json response and add limit to json file size

app.use(express.urlencoded({ extended: true })); //to handle url having special character

app.use(express.static("public")); //to handle file and folder or you can say static files eg. favicon,image

app.use(cookieParser());

import userRouter from "./routes/user.routes.js";

//routes declaration

app.use("/api/v1/users", userRouter);

//https://localhost:8000/api/v1/users/register

export { app };
