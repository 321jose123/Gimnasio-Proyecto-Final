const fs = require('fs');
const path = require('path');
const { apiService, apiServiceImage } = require('../apiServices');
const { API_URL_DELETE_USER, API_URL_ADD_USER, API_URL_UPDATE_USER, API_URL_UPDATE_USER_PROFILE_IMAGE, API_URL_ADD_CARD_TO_USER } = require('../../../config');
const { formatToUTC } = require('../../helpers/validate.helpers');
const { getCardFromUser } = require('../../models/cards/cards.models');
const { getUserImage } = require('../../models/users/userImage.model');
const { updateUserAccesses } = require('../../models/users/usersEditAccess.model');


const { API_USERNAME, API_PASSWORD } = process.env;

// Función para crear o actualizar un usuario en el dispositivo
const createUserInDevice = async (user) => {
  try {
    const jsonData = {
      userInfo: {
        employeeNo: user.employee_no,
        name: user.name,
        userType: user.user_type || "normal",
        Valid: {
          enable: user.valid_enable,
          beginTime: formatToUTC(user.valid_begin_time),
          endTime: formatToUTC(user.valid_end_time),
        },
        doorRight: user.door_right || "1",
        RightPlan: [
          {
            doorNo: user.door_no || 1,
            planTemplateNo: user.plan_template_no || "1",
          }
        ],
        localUIUserType: user.local_ui_user_type || "admin",
        userVerifyMode: user.user_verify_mode || "faceOrFpOrCardOrPw",
        checkUser: true,
        terminalNoList: [1],
        addUser: user.add_user || true,
      }
    };

    const response = await apiService.post(API_URL_UPDATE_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');
    console.log('Usuario creado en el dispositivo:', response);
    return { success: true };
  } catch (apiError) {
    console.error('Error: el usuario ya existe en el dispositivo:', apiError);
    return {
      error: true,
      statusCode: 409,
      message: 'Error: el usuario ya existe en el dispositivo.',
      data: {
        statusCode: 6,
        statusString: 'Invalid Content',
        subStatusCode: 'employeeNoAlreadyExist',
        errorCode: 1610637344,
        errorMsg: 'checkUser'
      }
    };
  }
};

const updateUserTimeAccessInDevice = async (employeeNo, beginTime, endTime) => {
  try {
    const jsonData = {
      userInfo: {
        employeeNo: employeeNo,
        Valid: {
          beginTime: formatToUTC(beginTime),
          endTime: formatToUTC(endTime),
        }
      }
    };
    const response = await apiService.put(API_URL_UPDATE_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');
    console.log('Usuario actualizado en el dispositivo:', response);
    return { success: true };
  } catch (apiError) {
    console.error('Error: el usuario no se pudo actualizar:', apiError);
    console.log('Error: el usuario no se pudo actualizar:', apiError.error);
    return {
      error: true,
      statusCode: 409,
      error: true,
      statusCode: 409,
      message: 'Error: el usuario no se pudo actualizar.' + apiError,
    };
  }
};

// Función para manejar las tarjetas del usuario
const handleUserCards = async (employeeNo) => {
  try {
    const userCards = await getCardFromUser(employeeNo);
    console.log("userCards", userCards);

    if (userCards.length > 0) {
      console.log(`Tarjetas encontradas para el usuario ${employeeNo}:`);
      const dataParse = {
        CardInfo: {
          employeeNo: employeeNo,
          cardNo: userCards[0].card_no,
          deleteCard: true,
          cardType: 'normalCard',
          checkCardNo: true,
          checkEmployeeNo: true,
          addCard: true,
          operateType: 'byTerminal',
          terminalNoList: [1],
        }
      };
      console.log("dataParse", dataParse);

      const data = await apiService.post(API_URL_ADD_CARD_TO_USER, API_USERNAME, API_PASSWORD, dataParse, 'application/json');
      console.log(`Tarjeta agregada para el usuario ${employeeNo}`);
    } else {
      console.log(`No se encontraron tarjetas para el usuario ${employeeNo}.`);
    }

    return { success: true };
  } catch (cardError) {
    console.error('Error al obtener las tarjetas del usuario:', cardError);
    return {
      error: true,
      statusCode: 500,
      message: 'Error al verificar las tarjetas del usuario.',
      error: cardError.message,
    };
  }
};

// Función para manejar la imagen del perfil del usuario
const handleUserProfileImage = async (employeeNo) => {
  try {
    const imagerecord = await getUserImage(employeeNo);
    const img64 = imagerecord?.img64 || null;

    if (img64 && typeof img64 === 'string' && img64.trim() !== '') {
      const tempImagePath = path.join('/tmp', `tempImage_${employeeNo}_${Date.now()}.jpg`);
      const imgBuffer = Buffer.from(img64, 'base64');
      fs.writeFileSync(tempImagePath, imgBuffer);

      console.log('Imagen temporal guardada:', tempImagePath);

      const faceDataRecord = {
        faceLibType: "blackFD",
        FDID: "1",
        FPID: employeeNo,
      };

      const apiResponse = await apiServiceImage.post(
        API_URL_UPDATE_USER_PROFILE_IMAGE,
        API_USERNAME,
        API_PASSWORD,
        JSON.stringify(faceDataRecord),
        tempImagePath
      );
      console.log('Imagen actualizada en el dispositivo:', apiResponse);

      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
        console.log('Imagen temporal eliminada.');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error al manejar la imagen del perfil del usuario:', error);
    return {
      error: true,
      statusCode: 500,
      message: 'Error al manejar la imagen del perfil del usuario.',
      error: error.message,
    };
  }
};

// Función para eliminar un usuario del dispositivo
const deleteUserFromDevice = async (employeeNo) => {
  try {
    const jsonData = {
      UserInfoDelCond: {
        EmployeeNoList: [{ employeeNo: employeeNo }],
        operateType: "byTerminal",
        terminalNoList: [1]
      }
    };

    const deleteResponse = await apiService.put(API_URL_DELETE_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');
    console.log('Usuario eliminado del dispositivo:', deleteResponse);
    return { success: true };
  } catch (deleteError) {
    console.error('Error al eliminar el usuario del dispositivo:', deleteError);
    return {
      error: true,
      statusCode: 500,
      message: 'Error al eliminar el usuario del dispositivo.',
      error: deleteError.message,
    };
  }
};

module.exports = {
  createUserInDevice,
  updateUserTimeAccessInDevice,
  handleUserCards,
  handleUserProfileImage,
  deleteUserFromDevice,
  updateUserAccesses,
};