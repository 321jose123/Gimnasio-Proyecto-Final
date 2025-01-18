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

/**
 * Busca un usuario en la base de datos y en el dispositivo.
 * @param {Array<String>} EmployeeNoList - Lista de números de empleado.
 * @param {String} fuzzySearch - Búsqueda por patrón.
 * @returns {Object}
 * @property {Boolean} success - Indica si la petición se realizó correctamente.
 * @property {String} message - Mensaje de respuesta.
 * @property {String} source - Origen de la respuesta. Puede ser "database" o "device".
 * @property {Object} data - Usuario encontrado.
 */
const searchUser = async (req, res) => {
  try {
    const { EmployeeNoList = [], fuzzySearch = "" } = req.body;

    if (!Array.isArray(EmployeeNoList) || EmployeeNoList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos un número de empleado en EmployeeNoList.",
        data: null,
      });
    }

    const firstEmployeeNo = EmployeeNoList[0];
    const userFromDB = await UserModel.searchUserByEmployeeNo(firstEmployeeNo);

    if (userFromDB) {
      return res.status(200).json({
        success: true,
        message: "Usuario encontrado en la base de datos.",
        source: "database",
        data: userFromDB,
      });
    }

    const userFromDevice = await findUserInDevice(EmployeeNoList, fuzzySearch);

    return res.status(200).json({
      success: true,
      message: "Usuario encontrado en el dispositivo.",
      source: "device",
      data: userFromDevice,
    });
  } catch (err) {
    console.error("Error en searchUser:", err);
    return res.status(500).json({
      success: false,
      message: "Error al buscar usuario.",
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
};


/**
 * Obtiene las capacidades del usuario configuradas en el dispositivo.
 * @returns {Object}
 * @property {Boolean} success - Indica si la petición se realizó correctamente.
 * @property {String} message - Mensaje de respuesta.
 * @property {String} source - Origen de la respuesta. En este caso, siempre es "device".
 * @property {Object} data - Capacidades del usuario.
 */
const getUserCapabilities = async (req, res) => {
  try {
    const data = await apiService.get(API_URL_INFORMACION_CONFIGURACION_USUARIO, API_USERNAME, API_PASSWORD);
    return res.status(200).json({
      success: true,
      message: 'Capacidades del usuario obtenidas correctamente',
      source: 'device',
      data: data
    })
  } catch (error) {
    res.status(500).send('Error al obtener capacidades del usuario');
  }
};

/**
 * Actualiza la imagen de perfil del usuario en el dispositivo y la base de datos.
 * @property {String} EmployeeNoList - Un arreglo con al menos un número de empleado.
 * @property {String} img64 - La imagen en base64.
 * @returns {Object}
 * @property {Boolean} success - Indica si la petición se realizó correctamente.
 * @property {String} message - Mensaje de respuesta.
 * @property {Object} data - La respuesta de la API del dispositivo.
 */
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
      return res.status(500).json({
        success: false,
        message: 'Error al guardar la imagen del usuario.',
        details: process.env.NODE_ENV === 'production' ? undefined : 'Revisa el formato de la imagen o verifica los permisos del sistema de almacenamiento.',
        timestamp: new Date().toISOString(),
      });
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

      res.status(200).json({ 
        success: true,
        message: 'Actualización exitosa', 
        data: apiResponse });
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

  /**
   * Obtiene la imagen de perfil del usuario en formato JPEG.
   * @returns {Promise<Response>}
   * @property {String} Content-Type - El tipo de contenido de la respuesta. En este caso, siempre es "image/jpeg".
   * @property {Buffer} body - El contenido de la respuesta. En este caso, la imagen en formato JPEG.
   */
const getUserImageAsJPEG = async (req, res) => {
  try {
    const { employeeNo } = req.params;

    if (!employeeNo || isNaN(employeeNo)) {
      return res.status(400).json({ message: 'employeeNo es obligatorio y debe ser un número válido.' });
    }

    const existingUser = await UserModel.searchUserByEmployeeNo(userData.employeeNo);
    if (!existingUser) {
      return res.status(404).json({
        message: 'El usuario no existe en la base de datos.',
        data: existingUser,
      });
    }

    const imagerecord = await UserModel.getUserImage(employeeNo);

    const img64 = imagerecord.img64

    if (!img64 || typeof img64 !== 'string' || img64.trim() === '') {
      return res.status(404).json({ message: 'Imagen no encontrada para el usuario.' });
    }

    const img64String = img64.toString();


    const img64Cleaned = img64String.replace(/\s+/g, '').replace(/[^A-Za-z0-9+/=]/g, '');

    const img64WithHeader = img64Cleaned.startsWith('data:image/jpeg;base64,')
      ? img64Cleaned
      : `data:image/jpeg;base64,${img64Cleaned}`;


    const imgBuffer = Buffer.from(img64WithHeader.split(',')[1], 'base64');

    const croppedImage = sharp(imgBuffer)
    try {
      croppedImage = await sharp(imgBuffer)
        .resize(300, 300, { fit: 'cover', position: 'center' })
        .jpeg()
        .toBuffer();
    } catch (imageError) {
      console.error('Error al procesar la imagen:', imageError);
      return res.status(500).json({
        message: 'Error al procesar la imagen.',
        error: imageError.message,
      });
    }

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

/**
 * Agrega un nuevo usuario a la base de datos y el dispositivo.
 * @property {Object} userData - Información del usuario.
 * @property {String} userData.employeeNo - Número de empleado del usuario.
 * @property {String} userData.name - Nombre del usuario.
 * @property {Object} userData.Valid - Información de la fecha de inicio y fin de vigencia del usuario.
 * @property {String} userData.Valid.beginTime - Fecha de inicio de vigencia del usuario en formato 'YYYY-MM-DDTHH:mm:ss.SSSZ'.
 * @property {String} userData.Valid.endTime - Fecha de fin de vigencia del usuario en formato 'YYYY-MM-DDTHH:mm:ss.SSSZ'.
 * @property {Object} jsonData - Información del usuario en formato JSON.
 * @returns {Object}
 * @property {String} message - Mensaje de respuesta.
 * @property {Object} data - La respuesta de la API del dispositivo.
 */
const addUserInfo = async (req, res) => {

  try {

    const { Valid } = req.body;

    const { beginTime, endTime } = Valid || {};

    if (!validateDateRange(beginTime, endTime)) {
      return res.status(400).json({ message: 'La fecha de inicio debe ser menor que la fecha de fin' });
    }

    const { userData, jsonData } = buildUserObjects(req.body);

    const existingUser = await UserModel.searchUserByEmployeeNo(userData.employeeNo);
    if (existingUser) {
      return res.status(409).json({
        message: 'El usuario ya existe en la base de datos.',
        data: existingUser,
      });
    }

    const newUser = await UserModel.createUser(userData);

    const response = await apiService.post(API_URL_ADD_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');

    res.status(200).json({
      message: 'Usuario agregado exitosamente',
      data: {
        response
      },
    });

  } catch (error) {
    handleError(res, error, 'Error al agregar usuario');
    res.status(500).json({
      message: 'Error interno del servidor al agregar usuario',
      error: error.message,
    });
  }
};

/**
 * Elimina un usuario de la base de datos y el dispositivo.
 * @property {String} employeeNo - Número de empleado del usuario a eliminar.
 * @returns {Object}
 * @property {Boolean} success - Indica si la petición se realizó correctamente.
 * @property {String} message - Mensaje de respuesta.
 * @property {Object} data - Contiene el número de empleado del usuario eliminado.
 * @property {Array} errors - Contiene un arreglo de errores con sus respectivos mensajes y stack traces.
 */
const deleteUser = async (req, res) => {

  const { employeeNo } = req.body;

  try {

    const deletedUser = await UserModel.deleteUserByEmployeeNo(employeeNo);

    if (!deletedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const jsonData = {
      UserInfoDelCond: {
        EmployeeNoList: [{
          employeeNo: employeeNo
        }],
        operateType: "byTerminal",
        "terminalNoList": [1]
      }
    }

    const response = await apiService.put(API_URL_DELETE_USER, API_USERNAME, API_PASSWORD, jsonData, contentType = 'application/json');

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente.',
      data: {
        employeeNo,
      },
      errors: [],
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario.',
      data: null,
      errors: [{ message: error.message, stack: error.stack }],
    });
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
