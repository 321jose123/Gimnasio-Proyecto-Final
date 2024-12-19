const express = require('express');
const router = express.Router();

const { validateCardIdDelete, validateCardAddToUser, validateCardIdFromUser } = require('../middlewares/validators/cardUser.validator');
const { validateFingerprint, validateDeleteUser } = require('../middlewares/validators/user.validator');

const {getUserCapabilities, deleteUser} = require('../controllers/users/user.controller');
const {getChannelPicture} = require('../controllers/face/faceCaptureImage.controller');
const {postUserFingerprint} = require('../controllers/finger/fingerCapture.controller');
const {getUserCardId, deleteUsercard, addCardToUser, getCardIdFromUser} = require('../controllers/cards/card.controller');

router.get('/user/capabilities', getUserCapabilities);
// router.get('/channel/picture', getChannelPicture);

router.put('/user/deleteuser', validateDeleteUser ,deleteUser)

router.post('/user/fingerprint', validateFingerprint, postUserFingerprint);

router.put('/user/deleteusercard', validateCardIdDelete, deleteUsercard);
router.get('/user/getcardid', getUserCardId)
router.post('/user/addcardtouser', validateCardAddToUser , addCardToUser)
router.post('/user/searchIdCardFromUser', validateCardIdFromUser , getCardIdFromUser);

module.exports = router;
