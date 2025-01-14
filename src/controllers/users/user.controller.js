const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { apiService, apiServiceImage } = require('../../services/apiServices');
const { API_URL_INFORMACION_CONFIGURACION_USUARIO, API_URL_DELETE_USER, API_URL_ADD_USER, API_URL_SEARCH_USER, API_URL_UPDATE_USER_PROFILE_IMAGE } = require('../../../config');
const { validateDateRange } = require('../../helpers/validate.helpers');
const UserModel = require('../../models/users/users.models');
const { findUserInDevice } = require('../../services/userServices/findUserInDevice');
const { handleError } = require('../../services/errors/handleErrors');
const { buildUserObjects } = require('../../services/userServices/buildUserObjet');

const { API_USERNAME, API_PASSWORD } = process.env;

const searchUser = async (req, res) => {
  try {
    const { EmployeeNoList = [], fuzzySearch = "" } = req.body;

    const firstEmployeeNo = EmployeeNoList[0];

    const userFromDB = await UserModel.searchUserByEmployeeNo(firstEmployeeNo);

    if (userFromDB) {
      return res.status(200).json({
        message: 'Usuario encontrado en la base de datos',
        source: 'database',
        data: userFromDB,
      });
    }

    const userFromDevice = await findUserInDevice(EmployeeNoList, fuzzySearch);

    return res.status(200).json({
      message: "Búsqueda de usuario",
      source: "device",
      data: userFromDevice,
    });
  } catch (err) {
    handleError(res, err, 'error al buscar usuario');
  }
};

const getUserCapabilities = async (req, res) => {
  try {
    const data = await apiService.get(API_URL_INFORMACION_CONFIGURACION_USUARIO, API_USERNAME, API_PASSWORD);
    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener capacidades del usuario');
  }
};

const updateUserFace = async (req, res) => {

  try {
    const { EmployeeNoList = [], img64 } = req.body;

    const employeeNo = EmployeeNoList[0];

    const existingUser = await UserModel.searchUserByEmployeeNo(employeeNo);
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const savedImage = await UserModel.saveUserImage(employeeNo, img64);

    if (!savedImage) {
      return res.status(500).json({ message: 'Error al guardar la imagen del usuario.' });
    }

    const jsonData = {
      UserInfoSearchCond: {
        searchID: "UserSearch",
        searchResultPosition: 0,
        maxResults: 1,
        EmployeeNoList: EmployeeNoList.map((employeeNo) => ({ employeeNo })),
      },
    };

    const UserValidateResponse = await apiService.post(API_URL_SEARCH_USER, API_USERNAME, API_PASSWORD, jsonData, "application/json");

    if (!UserValidateResponse || !UserValidateResponse.UserInfoSearch) {
      return res.status(500).json({ message: 'Respuesta inválida de la API de validación de usuario.' });
    }

    const responseStatusStrg = UserValidateResponse.UserInfoSearch.responseStatusStrg;

    if (responseStatusStrg !== 'OK') {
      return res.status(400).json({ message: 'Error en la validación del usuario' });
    }
    const jpegBuffer = Buffer.from(img64, 'base64');
    const tempImagePath = path.join(__dirname, 'tempImage.jpg');
    fs.writeFileSync(tempImagePath, jpegBuffer);

    const faceDataRecord = {
      faceLibType: "blackFD",
      FDID: "1",
      FPID: EmployeeNoList[0],
    };

    try {
      const apiResponse = await apiServiceImage.post(
        API_URL_UPDATE_USER_PROFILE_IMAGE,
        API_USERNAME,
        API_PASSWORD,
        JSON.stringify(faceDataRecord),
        tempImagePath
      );

      res.status(200).json({ message: 'Actualización exitosa', data: apiResponse });
    } catch (error) {
      console.error('Error en la actualización:', error);
      res.status(500).json({ message: 'Error en la actualización de la imagen.' });
    } finally {
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
        console.log('Temporary image removed.');
      }
    }

  } catch (error) {
    console.error('Error in updateUserFace:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getUserImageAsJPEG = async (req, res) => {
  try {
    const { employeeNo } = req.params;

    if (!employeeNo) {
      return res.status(400).json({ message: 'employeeNo es obligatorio.' });
    }

    // Obtener la imagen en formato Base64 desde la base de datos
    const imagerecord = await UserModel.getUserImage(employeeNo);

    const img64 = imagerecord.img64

    if (!img64) {
      return res.status(404).json({ message: 'Imagen no encontrada para el usuario.' });
    }

    const img64String = img64.toString();


    const img64Cleaned = img64String.replace(/\s+/g, '').replace(/[^A-Za-z0-9+/=]/g, '');

    const img64WithHeader = img64Cleaned.startsWith('data:image/jpeg;base64,')
      ? img64Cleaned
      : `data:image/jpeg;base64,${img64Cleaned}`;


    const imgBuffer = Buffer.from(img64WithHeader.split(',')[1], 'base64');

    const croppedImage = await sharp(imgBuffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg()
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(croppedImage);
  } catch (error) {
    console.error('Error al obtener la imagen en formato JPEG:', error);
    res.status(500).json({
      message: 'Error interno del servidor al obtener la imagen.',
      error: error.message,
    });
  }
};

const addUserInfo = async (req, res) => {

  try {

    const { Valid } = req.body;

    const { beginTime, endTime } = Valid || {};

    if (!validateDateRange(beginTime, endTime)) {
      return res.status(400).json({ message: 'La fecha de inicio debe ser menor que la fecha de fin' });
    }

    const { userData, jsonData } = buildUserObjects(req.body);

    const newUser = await UserModel.createUser(userData);

    await apiService.post(API_URL_ADD_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');

    res.status(200).json({
      message: 'Usuario agregado exitosamente',
      data: newUser,
    });

  } catch (error) {
    handleError(res, error, 'Error al agregar usuario');
  }
};

const deleteUser = async (req, res) => {

  const { employeeNo } = req.body;

  try {

    const deletedUser = await UserModel.deleteUserByEmployeeNo(employeeNo);


    const jsonData = {
      UserInfoDelCond: {
        EmployeeNoList: [{
          employeeNo: employeeNo
        }],
        operateType: "byTerminal",
        "terminalNoList": [1]
      }
    }

    const data = await apiService.put(API_URL_DELETE_USER, API_USERNAME, API_PASSWORD, jsonData, contentType = 'application/json');

    res.json(data);

  } catch (error) {
    res.status(500).send('Error al eliminar usuario', error);
  }

}

module.exports = {
  getUserCapabilities,
  deleteUser,
  addUserInfo,
  searchUser,
  updateUserFace,
  getUserImageAsJPEG
};
