const express = require('express');
const router = express.Router();
const { broadcastEvent } = require('../controllers/events/socialEvent.controller');

// Define el endpoint POST para iniciar la difusión de un evento
// El frontend deberá enviar una petición a: POST /api/social-events/broadcast
router.post('/broadcast', broadcastEvent);

module.exports = router;