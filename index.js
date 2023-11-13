const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http").Server(app);

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
// 配置Socket.IO
configureSocketIO(http);

// 綁定qr-code api路徑
app.use("/", apiRoutes);
// 綁定sse api
app.use("/sse", sseRoutes);

// API port
const apiPort = 3000;
// SOCKET port
const socketPort = 3030;

http.listen(socketPort, () => console.log(`connected ${socketPort}`));

app.listen(apiPort, () => {});
