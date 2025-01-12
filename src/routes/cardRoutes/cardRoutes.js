const express = require('express');
const router = express.Router();
const {  deleteUsercard, getUserCardId, addCardToUser, getCardIdFromUser } = require('../../controllers/cards/card.controller');
const { validateCardAddToUser, validateCardIdDelete } = require('../../middlewares/validators/cardUser.validator');

router.get('/get-id', getUserCardId);
router.post('/add', validateCardAddToUser, addCardToUser);
router.put('/delete', validateCardIdDelete, deleteUsercard);
router.post('/search', validateCardIdDelete, getCardIdFromUser);

module.exports = router;
