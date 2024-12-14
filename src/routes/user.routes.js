const express = require('express');
const router = express.Router();
const { getUserCapabilities, getChannelPicture, postUserFingerprint } = require('../controllers/users/capabilities.users.controllers');


router.get('/user/capabilities', getUserCapabilities);
router.get('/channel/picture', getChannelPicture);
router.post('/user/fingerprint', postUserFingerprint);

module.exports = router;
