const express = require("express");
const router = express.Router();

/**
 *  接收使用者序號並派發QRcode url
 */
router.post("/qrcode", (req, res) => {
  const [user_id, connectMode] = [
    JSON.parse(req.body).id,
    JSON.parse(req.body).connectWith,
  ];

  const qr_url = `http://localhost:8080/mobile/signature/${user_id}/${connectMode}`;
  res.send(JSON.stringify({ data: { qr_url: qr_url } }));
});

module.exports = router;
