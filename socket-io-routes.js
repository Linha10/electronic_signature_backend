const { Server } = require("socket.io");

// 儲存的資料
const store = {};
// 房間
const roomList = [];
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

  // 開啟socket連線
  io.on("connect", async (socket) => {
    console.log("connect user:", socket.id);

    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    /**
     * 加入房間
     * @param {String} room_id 房間序號
     */
    socket.on("join-room", async (room_id) => {
      // 現在房間內有的人數(不包含當前user)
      const inRoomUsers = await io.in(room_id).fetchSockets();

      // 有房間序號 且 房間內使用者多於0
      if (roomList.includes(room_id) && inRoomUsers.length > 0) {
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
      roomList.push(room_id);
      console.log(roomList);
      socket.join(room_id);
    });

    /**
     * 從移動裝置端取得簽名圖檔資料(base 64)
     *
     * @param {String} image base64圖片檔
     * @param {String} roomId 房間序號
     */
    socket.on("send-signature", ({ image, roomId }) => {
      if (roomList.includes(roomId)) {
        store[roomId] = image;
        // 派發至指定房間
        io.to(roomId).emit("capture-signature", store[roomId]);
      }
    });

    /**
     * 斷開socket連線
     */
    socket.on("disconnect", () => {
      console.log(`${socket.id} is leaveing the room `);
      socket.disconnect();
    });
  });
  return io;
};

module.exports = configureSocketIO;
