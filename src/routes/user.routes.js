const express = require('express');
const router = express.Router();
const { getUserCapabilities, getChannelPicture, postUserFingerprint, getUserCardId, deleteUsercard } = require('../controllers/users/capabilities.users.controllers');


router.get('/user/capabilities', getUserCapabilities);
router.get('/channel/picture', getChannelPicture);
router.get('/user/getcardid', getUserCardId)
router.post('/user/fingerprint', postUserFingerprint);
router.put('/user/deleteusercard', deleteUsercard);

module.exports = router;
