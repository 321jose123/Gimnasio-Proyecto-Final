const express = require('express');
const router = express.Router();

// Tus rutas existentes
const userRoutes = require('./userRoutes/userRoutes');
const streamingRoutes = require('./streamingRoutes/streamingRoutes');
const fingerRoutes = require('./fingerPrintRoutes/fingerPrintRoutes');
const cardRoutes = require('./cardRoutes/cardRoutes');
const eventsRoutes = require('./systemEvents/systemEvents');
const groupsRoutes = require('./groupRoutes/groupRoutes');
const socialEventRoutes = require('./socialEvent.routes'); // <-- 1. Importar las nuevas rutas


// --- 1. IMPORTAR LAS NUEVAS RUTAS DE WHATSAPP ---
const whatsappRoutes = require('./whatsappRoutes');

// Registro de rutas existentes
router.use('/user', userRoutes);
router.use('/fingerprint', fingerRoutes );
router.use('/card', cardRoutes);
router.use('/streaming', streamingRoutes);
router.use('/events', eventsRoutes);
router.use('/groups', groupsRoutes);

// --- 2. REGISTRAR LAS NUEVAS RUTAS DE WHATSAPP ---
// Esto le dice a tu aplicación que cualquier petición a /api/whatsapp/...
// debe ser manejada por el router de WhatsApp.
router.use('/whatsapp', whatsappRoutes);
router.use('/social-events', socialEventRoutes); // <-- 2. Registrar las nuevas rutas


module.exports = router;
