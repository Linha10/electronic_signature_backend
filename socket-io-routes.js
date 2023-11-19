const { Server } = require("socket.io");

/**
 *  建立socket.io配置
 *
 * @param {Object} httpServer
 * @returns {object}
 */
const configureSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONT || "https://localhost:8080",
      methods: ["GET", "POST"],
    },
  });

  console.log(process.env.FRONT || "https://localhost:8080");

  // 房間id
  let rId = "";

  // 開啟socket連線
  io.on("connect", async (socket) => {
    console.log("connect", socket.id);

    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
    /**
     * 加入房間
     * @param {String} room_id 房間序號
     */
    socket.on("join-room", async (room_id) => {
      // 現在房間內有的人數(不包含當前user)
      const inRoomUsers = await io.in(rId).fetchSockets();
      // 有房間序號 且 房間內使用者多於0
      if (rId.length !== 0 && inRoomUsers.length > 0) {
        socket.join(room_id);

        const timeoutTime = 60 * 1000;
        setTimeout(() => {
          socket.emit("connect-error", {
            isError: true,
            content: "連接已超時,請重新開啟Qrcode",
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
      console.log("room_id", room_id);
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
      console.log("image", image);
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
  return io;
};

module.exports = configureSocketIO;
