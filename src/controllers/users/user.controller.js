const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { apiService, apiServiceImage } = require('../../services/apiServices');
const { API_URL_INFORMACION_CONFIGURACION_USUARIO, API_URL_DELETE_USER, API_URL_ADD_USER, API_URL_SEARCH_USER, API_URL_UPDATE_USER_PROFILE_IMAGE } = require('../../../config');
const { validateDateRange } = require('../../helpers/validate.helpers');
const UserModel = require('../../models/users/users.models');
const { handleError } = require('../../services/errors/handleErrors');
const { buildUserObjects } = require('../../services/userServices/buildUserObjet');
const { createUserInDevice, handleUserCards, handleUserProfileImage, updateUserTimeAccessInDevice } = require('../../services/userServices/buildUserDevice');
const { updateUserAccesses } = require('../../models/users/usersEditAccess.model');

const { DateTime } = require("luxon");


const { API_USERNAME, API_PASSWORD } = process.env;

const { searchUser } = require('./searchUser');
const { listAllUsers } = require('./listAllUsers');
const { searchGroupModel } = require('../../models/groups/searchGroup/searchGroup.model');

/**
 * Obtiene las capacidades del usuario desde el dispositivo.
 * @async
 * @function getUserCapabilities
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object>} - Objeto de respuesta con las capacidades del usuario.
 * @throws {Error} - Si hay un error al obtener las capacidades del usuario.
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
    console.error('Error al obtener capacidades del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener capacidades del usuario',
      error: error.message,
    });
  }
};

/**
 * Actualiza la imagen de perfil de un usuario.
 * 
 * @async
 * @function updateUserFace
 * @param {Object} req - Objeto de solicitud, que debe contener en el cuerpo un arreglo `EmployeeNoList` y una cadena `img64`.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<void>} - No devuelve un valor, pero envía una respuesta JSON con el resultado.
 * @throws {Error} - Lanza un error si ocurre algún problema al buscar el usuario, guardar la imagen o comunicarse con la API.
 * 
 * El flujo del proceso es el siguiente:
 * - Verifica la existencia del usuario en la base de datos usando el primer número de empleado en `EmployeeNoList`.
 * - Si el usuario existe, intenta guardar la imagen proporcionada en base64 (`img64`) en la base de datos.
 * - Valida la existencia del usuario en el dispositivo externo a través de una llamada a la API.
 * - Convierte la imagen base64 a un JPEG y la guarda temporalmente.
 * - Realiza una solicitud POST para actualizar la imagen de perfil del usuario en el dispositivo externo.
 * - Envía una respuesta JSON indicando el éxito o el fallo del proceso.
 * - Elimina la imagen temporalmente guardada después de que se haya completado el proceso.
 */
const updateUserFace = async (req, res) => {
  try {
    const { EmployeeNoList = [], img64 } = req.body;

    const employeeNo = EmployeeNoList[0];

    let existingUser;
    try {
      existingUser = await UserModel.searchUserByEmployeeNo(employeeNo);
    } catch (error) {
      return res.status(500).json({ message: 'Error al buscar el usuario en la base de datos.', error: error.message });
    }

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    let savedImage;
    try {
      savedImage = await UserModel.saveUserImage(employeeNo, img64);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al guardar la imagen del usuario.',
        error: error.message,
      });
    }

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

    let UserValidateResponse;
    try {
      UserValidateResponse = await apiService.post(API_URL_SEARCH_USER, API_USERNAME, API_PASSWORD, jsonData, "application/json");
    } catch (error) {
      return res.status(500).json({ message: 'Error al validar el usuario.', error: error.message });
    }

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

    let apiResponse;
    try {
      apiResponse = await apiServiceImage.post(
        API_URL_UPDATE_USER_PROFILE_IMAGE,
        API_USERNAME,
        API_PASSWORD,
        JSON.stringify(faceDataRecord),
        tempImagePath
      );
    } catch (error) {
      console.error('Error al actualizar la imagen en el dispositivo:', error);
      res.status(500).json({ message: 'Error al actualizar la imagen en el dispositivo.', error: error.message });
    }

    res.status(200).json({ success: true, message: 'Actualización exitosa', data: apiResponse });

    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }

  } catch (error) {
    console.error('Error en updateUserFace:', error);
    res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
};

/**
 * Elimina la imagen de un usuario en la base de datos y en el dispositivo.
 * @function deleteUserImage
 * @param {Object} req - Request object.
 * @param {Object} res - Response object.
 * @returns {Promise<Object>} - Response object with message and data.
 * @throws {Error} - If there is an error in the service.
 */
const deleteUserImage = async (req, res) => {
  const { employeeNo } = req.body;

  if (!employeeNo || isNaN(employeeNo)) {
    return res.status(400).json({ message: 'employeeNo es obligatorio y debe ser un número válido.' });
  }

  let existingUser;
  try {
    existingUser = await UserModel.searchUserByEmployeeNo(employeeNo);
  } catch (error) {
    return res.status(500).json({ message: 'Error al buscar el usuario en la base de datos.', error: error.message });
  }

  if (!existingUser) {
    return res.status(404).json({
      message: 'El usuario no existe en la base de datos.',
      data: existingUser,
    });
  }

  try {
    await UserModel.deleteUserImage(employeeNo);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al eliminar la imagen del usuario.',
      error: error.message,
    });
  }

  const jsonData = {
    "faceLibType": "blackFD",
    "FDID": "1",
    "FPID": employeeNo,
    "deleteFP": true
  };

  let response;
  try {
    response = await apiService.put(API_URL_UPDATE_USER_PROFILE_IMAGE, API_USERNAME, API_PASSWORD, JSON.stringify(jsonData));
  } catch (error) {
    return res.status(500).json({
      message: 'Error al eliminar la imagen en el dispositivo.',
      error: error.message,
    });
  }

  res.status(200).json({ message: 'Imagen eliminada exitosamente', data: response });
};


/**
 * Obtiene la imagen de perfil del usuario en formato JPEG.
 * @returns {Promise<Response>}
 * @property {String} Content-Type - El tipo de contenido de la respuesta. En este caso, siempre es "image/jpeg".
 * @property {Buffer} body - El contenido de la respuesta. En este caso, la imagen en formato JPEG.
 */
const getUserImageAsJPEG = async (req, res) => {
  try {
    const { employeeNo } = req.body;

    if (!employeeNo || isNaN(employeeNo)) {
      return res.status(400).json({ message: 'employeeNo es obligatorio y debe ser un número válido.' });
    }

    const existingUser = await UserModel.searchUserByEmployeeNo(employeeNo);
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

    croppedImage = sharp(imgBuffer)
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

    try {
      const newUser = await UserModel.createUser(userData);
      const response = await apiService.post(API_URL_ADD_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');

      res.status(200).json({
        message: 'Usuario agregado exitosamente',
        data: {
          newUser,
          response
        },
      });
    } catch (error) {
      console.error('Error al agregar el usuario:', error);
      res.status(500).json({
        message: 'Error interno del servidor al agregar usuario',
        error: error.message,
      });
    }
  } catch (error) {
    handleError(res, error, 'Error al agregar usuario');
    res.status(500).json({
      message: 'Error interno del servidor al agregar usuario',
      error: error.message,
    });
  }
};

/**
 * Actualiza la información de un usuario en la base de datos.
 * @async
 * @function updateUserInfo
 * @param {Object} req - Objeto de solicitud, que debe contener los datos del usuario a actualizar.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<void>} - No devuelve un valor, pero envía una respuesta JSON con el resultado.
 * @throws {Error} - Lanza un error si ocurre algún problema al actualizar la base de datos.
 */
const updateUserInfo = async (req, res) => {
  const { employeeNo, name, email, phoneNumber, address, city, country, dateOfBirth, Valid, groupID } = req.body;

  try {
    // Verificamos si el usuario existe
    const userParams = await UserModel.searchUserByEmployeeNo(employeeNo);
    if (!userParams) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const existingGroup = await searchGroupModel(groupID);

    if (!existingGroup) {
      return res.status(404).json({ message: 'Grupo no encontrado.' });
    }

    // Crear el objeto con los parámetros necesarios
    const userData = {
      employeeNo: userParams.employee_no,
      name: name,
      userType: userParams.user_type,
      doorRight: userParams.door_right,
      validEnable: userParams.valid_enable,
      validBeginTime: Valid ? Valid.beginTime : null,
      validEndTime: Valid ? Valid.endTime : null,
      planTemplateNo: userParams.plan_template_no,
      localUIUserType: userParams.local_ui_user_type,
      userVerifyMode: userParams.user_verify_mode,
      addUser: userParams.add_user,
      gender: userParams.gender,
      email: email ? email : userParams.email ? userParams.email : 'email@example.com',
      phoneNumber: phoneNumber ? phoneNumber : userParams.phone_number ? userParams.phone_number : '1234567890',
      address: address,
      city: city ? city : userParams.city ? userParams.city : 'Bucaramanga',
      country: country ? country : userParams.country ? userParams.country : 'Colombia',
      dateOfBirth: dateOfBirth,
      active: userParams.active,
      accesosDisponibles: userParams.accesos_disponibles,
      groupID: groupID
    };

    // Llamar al modelo para actualizar el usuario
    const result = await UserModel.updateUser(userData);
    const updateUserInDevice = await updateUserTimeAccessInDevice(employeeNo, userData.validBeginTime, userData.validEndTime);
    console.log('updateUserInDevice:', updateUserInDevice);

    // Verificar el resultado
    if (result.error) {
      return res.status(result.status || 400).json({ message: result.message });
    }

    res.status(200).json({
      message: 'Usuario actualizado exitosamente.',
      data: result.data,
    });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor al actualizar el usuario.',
      error: error.message,
    });
  }
};


/**
 * Actualiza el estado de un usuario en la base de datos y el dispositivo.
 *
 * @async
 * @function updateUserStatus
 * @param {Object} req - Objeto de solicitud, que debe contener en el cuerpo el número de empleado (`employeeNo`) y el nuevo estado (`status`).
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<void>} - No devuelve un valor, pero envía una respuesta JSON con el resultado.
 * @throws {Error} - Lanza un error si ocurre algún problema al buscar el usuario, actualizar el usuario en el dispositivo, manejar tarjetas, manejar la imagen de perfil, o actualizar el estado del usuario en la base de datos.
 *
 * El flujo del proceso es el siguiente:
 * - Verifica la existencia del usuario en la base de datos usando el número de empleado.
 * - Si el usuario existe y el estado es `true`, intenta crear o actualizar el usuario en el dispositivo, manejar tarjetas y manejar la imagen de perfil.
 * - Si el estado es `false`, intenta eliminar el usuario del dispositivo.
 * - Actualiza el estado del usuario en la base de datos.
 * - Envía una respuesta JSON indicando el éxito o el fallo del proceso.
 */

const updateUserStatus = async (req, res) => {

  const fechaDesactivacion = DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
  const cincoSegundosDespuesDeDesactivacion = DateTime.fromISO(fechaDesactivacion).plus({ seconds: 5 }).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

  console.log(fechaDesactivacion, cincoSegundosDespuesDeDesactivacion);

  try {
    const { employeeNo, status } = req.body;
    // Buscar al usuario por su número de empleado
    const user = await UserModel.searchUserByEmployeeNo(employeeNo);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    if (status === true) {
      // Crear o actualizar el usuario en el dispositivo
      // const createUserResponse = await createUserInDevice(user);
      // if (createUserResponse.error) {
      //   return res.status(createUserResponse.statusCode || 500).json(createUserResponse);
      // }


      console.log("usuario:", user);
      console.log("usuario valid_begin_time:", user.valid_begin_time);
      console.log("usuario valid_end_time:", user.valid_end_time);

      const createUserResponse = await updateUserTimeAccessInDevice(employeeNo, user.valid_begin_time, user.valid_end_time);
      if (createUserResponse.error) {
        return res.status(createUserResponse.statusCode || 500).json(createUserResponse);
      }
      // Manejar la imagen del perfil del usuario
      const imageResponse = await handleUserProfileImage(employeeNo);
      if (imageResponse.error) {
        console.error('Error al manejar la imagen del perfil del usuario:', imageResponse.error);
        return res.status(imageResponse.statusCode || 500).json(imageResponse);
      }

      // Manejar las tarjetas del usuario
      const cardResponse = await handleUserCards(employeeNo);
      if (cardResponse.error) {
        return res.status(cardResponse.statusCode || 500).json(cardResponse);
      }
    } else {
      // Eliminar el usuario del dispositivo
      console.log("🚨 Usuario desactivado, eliminando del dispositivo.");

      const deleteResponse = await updateUserTimeAccessInDevice(employeeNo, fechaDesactivacion, cincoSegundosDespuesDeDesactivacion);
      if (deleteResponse.error) {
        return res.status(deleteResponse.statusCode || 500).json(deleteResponse);
      }
    }
    // Actualizar el estado del usuario en la base de datos
    const updatedUser = await UserModel.updateUserStatus(employeeNo, status);
    // Respuesta final
    return res.status(200).json({
      message: 'Estado del usuario actualizado exitosamente.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error en updateUserStatus:', error);
    return res.status(500).json({
      message: 'Error interno del servidor.',
      error: error.message,
    });
  }
};

const updateUserAccessesService = async (req, res) => {

  const { employeeNo, accesses, beginTime, endTime } = req.body;

  try {
    const existingUser = await UserModel.searchUserByEmployeeNo(employeeNo);

    if (existingUser) {
      try {
        const updateUserAccessInDeviceResponse = await updateUserTimeAccessInDevice(employeeNo, beginTime, endTime);
        console.log('Accesos actualizados en el dispositivo:', updateUserAccessInDeviceResponse);
        const updateUserTimeAccessInDBResponse = await UserModel.updateUserAccessTime(employeeNo, beginTime, endTime);
        console.log('Accesos actualizados en la base de datos:', updateUserTimeAccessInDBResponse);
        const updatedUser = await updateUserAccesses(employeeNo, accesses);
        console.log('Accesos actualizados en la base de datos:', updatedUser);
        return res.status(200).json({
          message: 'Accesos actualizados exitosamente en la base de datos.',
          data: updatedUser,
        });
      } catch (error) {
        console.error('Error al actualizar los accesos del usuario:', error);
        return res.status(500).json({
          message: 'Error al actualizar los accesos del usuario.',
          error: error.message,
        });
      }
    }
    console.log('El usuario no existe en la base de datos.');
    return res.status(404).json({
      message: 'El usuario no existe en la base de datos.',
    });

  } catch (error) {
    console.error('Error al actualizar los accesos del usuario:', error);
    return res.status(500).json({
      message: 'Error al actualizar los accesos del usuario.',
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
  updateUserInfo,
  updateUserStatus,
  searchUser,
  listAllUsers,
  updateUserFace,
  deleteUserImage,
  getUserImageAsJPEG,
  updateUserAccessesService,
};
