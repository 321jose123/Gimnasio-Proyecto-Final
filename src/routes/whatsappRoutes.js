const express = require('express');
const router = express.Router();
const { getStatus, getQrCode } = require('../controllers/whatsapp/whatsapp.controller');

// Route to get the connection status of the WhatsApp client
router.get('/status', getStatus);

// Route to get the QR code for logging in
router.get('/qr', getQrCode);

module.exports = router;