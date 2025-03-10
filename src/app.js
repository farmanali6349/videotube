import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { cors_origin } from "./constants.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: cors_origin,
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
<html>
<head>
  <title>Server</title>
  <style>
      body {
        background: #121212;
        color: #f1f1f1;
  }  
  </style>
</head>

<body><h1>Server Is Ready</h1></body>
</html>`);
});

// routers import
import userRouter from "./routes/user.router.js";

// router routes
app.use("/api/v1/user", userRouter);

export { app };
