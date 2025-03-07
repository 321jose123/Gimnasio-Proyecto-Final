const express = require('express');
const router = express.Router();
const { getUserCapabilities, addUserInfo, deleteUser, searchUser, updateUserFace, getUserImageAsJPEG, deleteUserImage, updateUserStatus, updateUserAccessesService, updateUserInfo, listAllUsers } = require('../../controllers/users/user.controller');
const { validateDeleteUser, validateAddUser, validateUserSearch, validateUserImage, updateUserAccess, updateSingleAccess } = require('../../middlewares/validators/user.validator');

router.get('/capabilities', getUserCapabilities);
router.post('/add', validateAddUser, addUserInfo);
router.put('/update-user-access', updateUserAccess, updateUserStatus);
router.put('/delete', validateDeleteUser, deleteUser);
router.post('/search', validateUserSearch ,searchUser);
router.post('/update-face', validateUserImage , updateUserFace);
router.put('/delete-face', deleteUserImage);
router.get('/profile-image', getUserImageAsJPEG)
router.put('/update-accesses', updateSingleAccess , updateUserAccessesService)
router.post('/update-user-info', updateUserInfo)
router.get('/listUsers', listAllUsers)

module.exports = router;
