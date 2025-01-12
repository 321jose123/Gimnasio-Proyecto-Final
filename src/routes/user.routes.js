const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes/userRoutes');
const streamingRoutes = require('./streamingRoutes/streamingRoutes');
const fingerRoutes = require('./fingerPrintRoutes/fingerPrintRoutes');
const cardRoutes = require('./cardRoutes/cardRoutes');

router.use('/user', userRoutes);
router.use('/fingerprint', fingerRoutes );
router.use('/card', cardRoutes);
router.use('/streaming', streamingRoutes);


module.exports = router;