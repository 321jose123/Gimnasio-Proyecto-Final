const express = require('express');
const router = express.Router();

const { validateStreaming } = require('../../controllers/streaming/streamingChannel');
const { showInputStreaming } = require('../../controllers/streaming/showStreaming');

router.get('/', validateStreaming);
router.get('/live', showInputStreaming);

module.exports = router;
