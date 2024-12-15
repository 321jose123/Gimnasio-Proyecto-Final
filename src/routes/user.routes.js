const express = require('express');
const router = express.Router();
const {getUserCapabilities} = require('../controllers/users/userCapabilities.controller');
const {getChannelPicture} = require('../controllers/face/faceCaptureImage.controller');
const {postUserFingerprint} = require('../controllers/finger/fingerCapture.controller');
const {getUserCardId} = require('../controllers/cards/card.controller');
const {deleteUsercard} = require('../controllers/cards/card.controller');

router.get('/user/capabilities', getUserCapabilities);
router.get('/channel/picture', getChannelPicture);
router.get('/user/getcardid', getUserCardId)
router.post('/user/fingerprint', postUserFingerprint);
router.put('/user/deleteusercard', deleteUsercard);

module.exports = router;
