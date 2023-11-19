const express = require("express");
const router = express.Router();
const clientList = [];

let signatureDataList = {};
router.use(express.json());

/**
 * 確認是否已存有使用者
 * @param {String} user 使用者序號
 * @returns {Number}
 */
const getUserIndex = (userId) =>
  clientList.findIndex((item) => item === userId);

/**
 * 處理SSE訊息
 *
 * @param {String} userId 使用者序號
 * @returns {Object}
 */
const handleUserMessage = (userId) =>
  // 是否有符合該使用者序號的簽名
  signatureDataList[userId]
    ? signatureDataList[userId]
    : { id: userId, status: "pending", signature: "" };

/**
 *  desktop 建立SSE連線 (無法接收前端參數)
 *
 */
router.get("/get-data", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  // 保持連線
  res.setHeader("Connection", "keep-alive");

  const user = req.query.userId;

  // 未存取使用者
  if (getUserIndex(user) < 0) clientList.push(user);

  // 清除前次簽名紀錄
  delete signatureDataList[user];

  res.write("event:connect \n");

  const keepStream = setInterval(() => {
    const message = handleUserMessage(user);

    res.write(`id:${user}\n`);
    res.write(`data:${JSON.stringify(message)} \n\n`);

    // 取得對應簽名，移除計時
    if (message.status === "success") clearInterval(keepStream);
  }, 2500);

  // 斷開SSE連線
  req.on("close", () => {
    const index = getUserIndex(user);

    // 移除客戶端
    if (index !== -1) {
      clientList.splice(index, 1);
    }

    console.log(`${user} is disconnect`);
  });
});

/*
 * 行動裝置取得簽名base64資料
 */
router.post("/send-data", (req, res) => {
  const { id, signature } = JSON.parse(req.body);
  const eleSignature = { id, status: "success", signature };
  // 建立使用者簽名資訊
  signatureDataList[id] = eleSignature;

  res.send({ code: 200, message: "Data received and saved" });
});

// 檢查電腦版是否開啟 > 手機版開啟時執行，確認有id有成功對應到clientList
router.get("/check", (req, res) => {
  const user = req.query.userId;
  const permission = clientList.includes(user);
  permission
    ? res.send({ permission })
    : res.send({
        feedback: {
          content: "請保持QRcode開啟或確認網路狀態",
          isError: true,
          code: "room-error",
        },
      });
});

module.exports = router;
