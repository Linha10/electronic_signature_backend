const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: `http://localhost:8080`,
  },
});

const bodyParser = require("body-parser");

app.io = io;

app.use(cors());
app.use(bodyParser.text({ type: "*/*" }));

app.use(express.json());

// API port
const apiPort = 3000;
// SOCKET port
const socketPort = 3030;

// 房間id
let rId = "";

// 開啟socket連線
io.on("connect", async (socket) => {
  /**
   * 加入房間
   * @param {String} room_id 房間序號
   */
  socket.on("join-room", async (room_id) => {
    // 現在房間內有的人數(不包含當前user)
    const inRoomUsers = await io.in(rId).allSockets();

    // 有房間序號 且 房間內使用者多於0
    if (rId.length !== 0 && inRoomUsers.size > 0) {
      socket.join(room_id);

      const timeoutTime = 60 * 1000;
      // 連線超時 > 應該寫在create-room時，設定room的存活時間
      // 當room超時，要emit給mobile端time-out error
      setTimeout(async () => {
        socket.emit("connect-error", {
          isError: true,
          content: "連接已超時，請重新開啟Qrcode",
          code: "time-out",
        });
        socket.disconnect();
      }, timeoutTime);
    } else {
      socket.emit("connect-error", {
        content: "請保持QRcode開啟或確認網路狀態",
        isError: true,
        code: "room-error",
      });
      socket.disconnect();
    }
  });

  /**
   * 建立私人房間
   * @param {String} room_id 房間序號
   */
  socket.on("createRoom", async (room_id) => {
    rId = room_id;
    socket.join(room_id);
  });

  /**
   * 從移動裝置端取得簽名圖檔資料(base 64)
   *
   * @param {String} image base64圖片檔
   * @param {String} roomId 房間序號
   */
  socket.on("send-signature", ({ image, roomId }) => {
    // 派發至指定房間
    io.to(roomId).emit("capture-signature", image);
  });

  /**
   * 斷開socket連線
   */
  socket.on("disconnect", () => {
    socket.disconnect();
  });
});

/**
 *  接收使用者序號並派發QRcode url
 */
app.post("/qrcode", (req, res) => {
  const user_id = JSON.parse(req.body).id;

  const qr_url = `http://localhost:8080/mobile/signature/${user_id}`;

  res.send(JSON.stringify({ data: { qr_url } }));
});

http.listen(socketPort, () => console.log(`connected ${socketPort}`));

app.listen(apiPort, () => {});
