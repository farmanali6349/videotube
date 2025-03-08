import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { cors_origin } from "./constants.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: cors_origin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.static("public"));

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

export { app };
