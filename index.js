const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

const { createServer } = require("http");

const httpServer = createServer(app);

const bodyParser = require("body-parser");
app.use(bodyParser.text({ type: "*/*" }));

app.use(express.json());

// 引入Socket.io配置
const configureSocketIO = require("./socket-io-routes");
// 引入qr-code相關api
const apiRoutes = require("./qr-code");
// 引入SSE 相關api
const sseRoutes = require("./server-sent-event");

// 綁定qr-code api路徑
app.use("/", apiRoutes);
// 綁定sse api
app.use("/sse", sseRoutes);

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.FRONT || "https://localhost:8080"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API port
const apiPort = 443;
// SOCKET port
const socketPort = 3030;

app.listen(apiPort, () => {});

const io = configureSocketIO(httpServer); // 配置Socket.IO // http
// http
io.listen(socketPort, () => console.log(`socket connected ${socketPort}`));
