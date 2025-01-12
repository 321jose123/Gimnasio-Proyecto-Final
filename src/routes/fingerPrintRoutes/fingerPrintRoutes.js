const express = require('express');
const router = express.Router();
const { postUserFingerprint } = require('../../controllers/finger/fingerCapture.controller');
const { validateFingerprint } = require('../../middlewares/validators/fingerUser.validator');


router.post('/', validateFingerprint , postUserFingerprint);

module.exports = router;
