const express = require('express');
const { eventsCapture } = require('../../controllers/events/eventsCapture.controller');
const router = express.Router();



router.post('/userEvents', eventsCapture);


module.exports = router;
