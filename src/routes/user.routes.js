const express = require('express');
const router = express.Router();

const { ValidateCardIdDelete, validateFingerprint, validateCardAddToUser, validateCardIdFromUser } = require('../middlewares/validators/users.validators');

const {getUserCapabilities} = require('../controllers/users/userCapabilities.controller');
const {getChannelPicture} = require('../controllers/face/faceCaptureImage.controller');
const {postUserFingerprint} = require('../controllers/finger/fingerCapture.controller');
const {getUserCardId, deleteUsercard, addCardToUser, getCardIdFromUser} = require('../controllers/cards/card.controller');

router.get('/user/capabilities', getUserCapabilities);
// router.get('/channel/picture', getChannelPicture);
router.post('/user/fingerprint', validateFingerprint, postUserFingerprint);
router.put('/user/deleteusercard', ValidateCardIdDelete ,deleteUsercard);
router.get('/user/getcardid', getUserCardId)
router.post('/user/addcardtouser', validateCardAddToUser , addCardToUser)
router.post('/user/searchIdCardFromUser', validateCardIdFromUser , getCardIdFromUser)

module.exports = router;
