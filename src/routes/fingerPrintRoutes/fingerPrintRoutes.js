const express = require('express');
const router = express.Router();
const { postUserFingerprint, addFingertoUser } = require('../../controllers/finger/fingerCapture.controller');
const { validateFingerprint, validateAddFingerprintToUser } = require('../../middlewares/validators/fingerUser.validator');


router.post('/', validateFingerprint , postUserFingerprint);
router.post('/assign', validateAddFingerprintToUser , addFingertoUser);

module.exports = router;
