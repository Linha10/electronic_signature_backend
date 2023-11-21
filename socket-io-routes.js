const { Server } = require("socket.io");

// 儲存的資料
const store = {};
// 房間
const roomList = {};

// TODO
class Room {
  constructor(roomId, creator) {
    // 房間序號(使用者帳號)
    this.id = roomId;
    // 創建者socket id
    this.creator = creator;
    // 加入者socket id
    this.joiner = "";
  }
  // 設定加入人員
  setJoiner(joinerId) {
    this.joiner = joinerId;
  }
  // 是否滿房
  isRoomFull() {
    return this.joiner !== "";
  }
}
const isRoomExists = (roomId) => !!roomList[roomId];

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
      // 取得scoket實例數量
      const instance = await io.in(room_id).fetchSockets();
      // 取得房間
      const theRoom = isRoomExists(room_id) ? roomList[room_id] : null;
      const isJoinable = !theRoom?.isRoomFull();

      if (instance.length > 0 && isJoinable) {
        theRoom.setJoiner(socket.id);
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
      const room = new Room(room_id, socket.id);
      roomList[room_id] = room;
      socket.join(room_id);
    });

    /**
     * 從移動裝置端取得簽名圖檔資料(base 64)
     *
     * @param {String} image base64圖片檔
     * @param {String} roomId 房間序號
     */
    socket.on("send-signature", ({ image, roomId }) => {
      if (isRoomExists(roomId)) {
        store[roomId] = image;
        console.log(" store[roomId]", store[roomId]);
        console.log("roomList[roomId]", roomList[roomId]);
        // 派發至指定房間
        socket.to(roomId).emit("capture-signature", store[roomId]);
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
