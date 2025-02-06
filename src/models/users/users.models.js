const userModel = require('./user.model');
const userImageModel = require('./userImage.model');
const userStatusModel = require('./userStatus.model');
const userDeleteModel = require('./userDelete.model');

module.exports = {
    ...userModel,
    ...userImageModel,
    ...userStatusModel,
    ...userDeleteModel
};
