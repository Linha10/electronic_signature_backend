const express = require("express");
const cors = require("cors");
const app = express();

const { createServer } = require("http");
const { server } = require("socket.io");
const httpServer = createServer(app);
// const http = require("http").Server(app);

app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.text({ type: "*/*" }));

app.use(express.json());

// 引入Socket.io配置
const configureSocketIO = require("./socket-io-routes");
// 引入qr-code相關api
const apiRoutes = require("./qr-code");
// 引入SSE 相關api
const sseRoutes = require("./server-sent-event");
// 配置Socket.IO // http
configureSocketIO(httpServer);

// 綁定qr-code api路徑
app.use("/", apiRoutes);
// 綁定sse api
app.use("/sse", sseRoutes);

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.FRONT || "https://localhost:8080"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // 允许所有预检请求通过
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API port
const apiPort = 9000;
// SOCKET port
const socketPort = 3030;

// http
httpServer.listen(socketPort, () => console.log(`connected ${socketPort}`));

app.listen(apiPort, () => {});
