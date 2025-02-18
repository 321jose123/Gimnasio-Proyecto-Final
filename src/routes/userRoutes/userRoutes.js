const express = require('express');
const router = express.Router();
const { getUserCapabilities, addUserInfo, deleteUser, searchUser, updateUserFace, getUserImageAsJPEG, deleteUserImage, updateUserStatus } = require('../../controllers/users/user.controller');
const { validateDeleteUser, validateAddUser, validateUserSearch, validateUserImage } = require('../../middlewares/validators/user.validator');

router.get('/capabilities', getUserCapabilities);
router.post('/add', validateAddUser, addUserInfo);
router.put('/update-user-access', updateUserStatus);
router.put('/delete', validateDeleteUser, deleteUser);
router.post('/search', validateUserSearch ,searchUser);
router.post('/update-face', validateUserImage , updateUserFace);
router.put('/delete-face', deleteUserImage);
router.get('/profile-image', getUserImageAsJPEG)

module.exports = router;
