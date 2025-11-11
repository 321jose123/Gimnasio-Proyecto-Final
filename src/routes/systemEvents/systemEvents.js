const express = require('express');
const { eventsCapture, getAllEventsCapture } = require('../../controllers/events/eventsCapture.controller');
const router = express.Router();



router.post('/userEvents', eventsCapture);
router.post('/allEvents', getAllEventsCapture);


module.exports = router;
