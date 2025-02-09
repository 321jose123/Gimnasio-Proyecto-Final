const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes/userRoutes');
const streamingRoutes = require('./streamingRoutes/streamingRoutes');
const fingerRoutes = require('./fingerPrintRoutes/fingerPrintRoutes');
const cardRoutes = require('./cardRoutes/cardRoutes');
const eventsRoutes = require('./systemEvents/systemEvents');

router.use('/user', userRoutes);
router.use('/fingerprint', fingerRoutes );
router.use('/card', cardRoutes);
router.use('/streaming', streamingRoutes);
router.use('/events', eventsRoutes)


module.exports = router;