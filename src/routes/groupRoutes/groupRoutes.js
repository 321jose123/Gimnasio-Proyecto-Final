const express = require('express');
const router = express.Router();
const { newGroup, searchGroup, listAllGroups } = require('../../controllers/groups/group.controller');
const { validateNewGroup, validateSearchGroup } = require('../../middlewares/validators/groupUser.validator');

router.post('/new', validateNewGroup, newGroup)
router.get('/search', validateSearchGroup, searchGroup)
router.get('/listAllGroups', listAllGroups)

module.exports = router;