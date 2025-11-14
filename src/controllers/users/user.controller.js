const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { apiService, apiServiceImage } = require('../../services/apiServices');
const { API_URL_INFORMACION_CONFIGURACION_USUARIO, API_URL_DELETE_USER, API_URL_ADD_USER, API_URL_SEARCH_USER, API_URL_UPDATE_USER_PROFILE_IMAGE,API_URL_REMOTE_DOOR_OPEN, API_URL_STREAMING } = require('../../../config');
const { validateDateRange } = require('../../helpers/validate.helpers');
const UserModel = require('../../models/users/users.models');
const { handleError } = require('../../services/errors/handleErrors');
const { buildUserObjects } = require('../../services/userServices/buildUserObjet');
const { createUserInDevice, handleUserCards, handleUserProfileImage, updateUserTimeAccessInDevice } = require('../../services/userServices/buildUserDevice');
const { updateUserAccesses } = require('../../models/users/usersEditAccess.model');

const { DateTime } = require("luxon");

// --- IMPORTACIÓN DEL NUEVO SERVICIO DE NOTIFICACIONES ---
const notificationService = require('../../services/whatsapp/notificationService');

const { API_USERNAME, API_PASSWORD } = process.env;
const { logNewUserRegistration, logDailyUserAccess } = require('../informes/informe.controller'); // Ajusta la ruta
const { insertEvent } = require('../../models/events/events.models');
const { searchUser } = require('./searchUser');
const { listAllUsers } = require('./listAllUsers');
const { searchGroupModel } = require('../../models/groups/searchGroup/searchGroup.model');


// --- ¡ESTAS SON LAS LÍNEAS QUE FALTABAN! ---
const axios = require('axios');
// (Asegúrate que la ruta a 'digestAuth' sea correcta según tu proyecto, basado en tu doc es 'utils/digestAuth')
const generateDigestAuthHeader = require('../../utils/digestAuth');

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
 * @async
 * @function updateUserFace
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
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
    const img64 = imagerecord.img64;
    if (!img64 || typeof img64 !== 'string' || img64.trim() === '') {
      return res.status(404).json({ message: 'Imagen no encontrada para el usuario.' });
    }
    const img64String = img64.toString();
    const img64Cleaned = img64String.replace(/\s+/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
    const img64WithHeader = img64Cleaned.startsWith('data:image/jpeg;base64,') ?
      img64Cleaned :
      `data:image/jpeg;base64,${img64Cleaned}`;
    const imgBuffer = Buffer.from(img64WithHeader.split(',')[1], 'base64');
    let croppedImage;
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
 * Agrega un nuevo usuario a la base de datos y al dispositivo.
 * Envía una notificación de bienvenida por WhatsApp.
 */
const addUserInfo = async (req, res) => {
  try {
    const { Valid, face_image, suscripcion, user_type } = req.body; // Capturamos face_image del body
    const { beginTime, endTime } = Valid || {};

    if (!validateDateRange(beginTime, endTime)) {
      return res.status(400).json({ message: 'La fecha de inicio debe ser menor que la fecha de fin' });
    }

    // buildUserObjects ahora debe ser capaz de procesar y pasar face_image
    // Asegúrate de que tu función buildUserObjects incluya face_image en el objeto userData
    const { userData, jsonData } = buildUserObjects(req.body);
    userData.suscripcion = suscripcion; // <-- LÍNEA AÑADIDA
    userData.user_type = user_type;     // <-- Ya está incluido aquí

    const existingUser = await UserModel.searchUserByEmployeeNo(userData.employeeNo);
    if (existingUser) {
      return res.status(409).json({
        message: 'El usuario ya existe en la base de datos.',
        data: existingUser,
      });
    }

    try {
      // El modelo createUser ya está preparado para recibir y guardar face_image
      const newUser = await UserModel.createUser(userData);
      const response = await apiService.post(API_URL_ADD_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');

      logNewUserRegistration(newUser);

      notificationService.sendWelcomeMessage({
        name: userData.name,
        phone_number: userData.phoneNumber
      }).catch(err => {
        console.error("Error al enviar el mensaje de bienvenida por WhatsApp:", err);
      });

      res.status(201).json({ // Cambiado a 201 Created para seguir mejores prácticas
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
  }
};




/**
 * Actualiza la información de un usuario en la base de datos.
 * @async
 * @function updateUserInfo
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 */
const updateUserInfo = async (req, res) => {
    // 1. Desestructuramos TODOS los campos del body (como en tu payload)
    const { 
        employeeNo, name, email, phoneNumber, address, city, country, dateOfBirth, 
        Valid, groupID, accesos_disponibles, suscripcion, user_type, updateRegistrationDate,
        nota 
    } = req.body;
  
    try {
        const userParams = await UserModel.searchUserByEmployeeNo(employeeNo);
        if (!userParams) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const finalGroupID = groupID ?? userParams.group_id;

        if (finalGroupID !== null) {
            // (Tu validación de groupID está bien)
            const existingGroup = await searchGroupModel(finalGroupID);
            if (!existingGroup) {
                return res.status(404).json({ message: 'El grupo asignado no existe.' });
            }
        }

        // 2. Construimos el objeto de datos COMPLETO para el modelo
        const userData = {
            // --- Datos del Payload ---
            employeeNo: employeeNo,
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            accesosDisponibles: accesos_disponibles,
            active: req.body.active, // Tomamos 'active' del payload
            validBeginTime: Valid?.beginTime,
            validEndTime: Valid?.endTime,
            user_type: user_type, 
            suscripcion: suscripcion, 
            registration_date: updateRegistrationDate ? new Date() : userParams.registration_date,
            nota: nota,
            
            // --- Datos del usuario original (que no se editan en este modal) ---
            groupID: finalGroupID,
            address: address ?? userParams.address,
            city: city ?? userParams.city,
            country: country ?? userParams.country,
            dateOfBirth: dateOfBirth ?? userParams.date_of_birth,
            doorRight: userParams.door_right,
            validEnable: userParams.valid_enable,
            planTemplateNo: userParams.plan_template_no,
            localUIUserType: userParams.local_ui_user_type,
            userVerifyMode: userParams.user_verify_mode,
            addUser: userParams.add_user,
            gender: userParams.gender
        };

        // 3. Llamamos al modelo de la BD para actualizar
        const result = await UserModel.updateUser(userData);

        // Si el modelo devolvió un error
        if (result.error) {
            throw new Error(result.message || 'Error en el modelo de base de datos.');
        }

        // 4. Sincronizamos con el dispositivo
        const updateUserInDevice = await updateUserTimeAccessInDevice(employeeNo, userData.validBeginTime, userData.validEndTime);
        console.log('updateUserInDevice:', updateUserInDevice);

        // 5. Registramos en informes (si es renovación)
        if (updateRegistrationDate) {
            logNewUserRegistration(result.data); // 'result.data' ES el usuario actualizado
            console.log(`[Informes] Se registró la renovación para ${employeeNo}`);
        }

        // --- ¡LA CORRECCIÓN MÁS IMPORTANTE! ---
        // Devolvemos 'result.data' (el objeto usuario), no 'result' (el objeto wrapper)
        res.status(200).json({
            message: 'Usuario actualizado exitosamente.',
            data: result.data 
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
 * @async
 * @function updateUserStatus
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 */
const updateUserStatus = async (req, res) => {
  const fechaDesactivacion = DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
  const cincoSegundosDespuesDeDesactivacion = DateTime.fromISO(fechaDesactivacion).plus({ seconds: 5 }).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
  
  try {
    const { employeeNo, status } = req.body;
    if (employeeNo === undefined || status === undefined) {
      return res.status(400).json({ message: 'Los campos employeeNo y status son requeridos.' });
    }

    const user = await UserModel.searchUserByEmployeeNo(employeeNo);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (status === true) {
      // Lógica para ACTIVAR al usuario en el dispositivo
      const createUserResponse = await updateUserTimeAccessInDevice(employeeNo, user.valid_begin_time, user.valid_end_time);
      if (createUserResponse.error) {
        return res.status(createUserResponse.statusCode || 500).json(createUserResponse);
      }
      const imageResponse = await handleUserProfileImage(employeeNo);
      if (imageResponse.error) {
        console.error('Error al manejar la imagen del perfil del usuario:', imageResponse.error);
        return res.status(imageResponse.statusCode || 500).json(imageResponse);
      }
      const cardResponse = await handleUserCards(employeeNo);
      if (cardResponse.error) {
        return res.status(cardResponse.statusCode || 500).json(cardResponse);
      }
    } else {
      // Lógica para DESACTIVAR al usuario en el dispositivo
      console.log("🚨 Usuario desactivado, eliminando del dispositivo.");
      const deleteResponse = await updateUserTimeAccessInDevice(employeeNo, fechaDesactivacion, cincoSegundosDespuesDeDesactivacion);
      if (deleteResponse.error) {
        return res.status(deleteResponse.statusCode || 500).json(deleteResponse);
      }
    }

    // Actualiza el estado en la base de datos después de la sincronización con el dispositivo
    const updatedUser = await UserModel.updateUserStatus(employeeNo, status);
    
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


/**
 * Actualiza los accesos de un usuario.
 * @async
 * @function updateUserAccessesService
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 */
const updateUserAccessesService = async (req, res) => {
  const { employeeNo, accesses, beginTime, endTime } = req.body;
  try {
    const existingUser = await UserModel.searchUserByEmployeeNo(employeeNo);
    if (!existingUser) {
      return res.status(404).json({
        message: 'El usuario no existe en la base de datos.',
      });
    }
    try {
      const updatedUser = await updateUserAccesses(employeeNo, accesses);
      const updateUserTimeAccessInDBResponse = await UserModel.updateUserAccessTime(employeeNo, beginTime, endTime);
      if (accesses > 0 && !existingUser.active) {
        await UserModel.updateUserStatus(employeeNo, true);
        console.log(`✔️ Usuario ${employeeNo} activado debido a que tiene accesos disponibles.`);
      } else if (accesses === 0 && existingUser.active) {
        await UserModel.updateUserStatus(employeeNo, false);
        console.log(`⛔ Usuario ${employeeNo} desactivado debido a que no tiene accesos disponibles.`);
      }
      const updateUserAccessInDeviceResponse = await updateUserTimeAccessInDevice(employeeNo, beginTime, endTime);
      const finalUser = await UserModel.searchUserByEmployeeNo(employeeNo);
      return res.status(200).json({
        message: 'Accesos actualizados exitosamente.',
        data: {
          ...finalUser,
          deviceResponse: updateUserAccessInDeviceResponse
        },
      });
    } catch (error) {
      console.error('Error al actualizar los accesos del usuario:', error);
      return res.status(500).json({
        message: 'Error al actualizar los accesos del usuario.',
        error: error.message,
      });
    }
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
 */
const deleteUser = async (req, res) => {
  const { employeeNo } = req.body;
  try {
    console.log(`Iniciando borrado del usuario ${employeeNo} en el dispositivo...`);
    const jsonData = {
      UserInfoDelCond: {
        EmployeeNoList: [{ employeeNo: employeeNo }],
        operateType: "byTerminal",
        terminalNoList: [1]
      }
    };
    await apiService.put(API_URL_DELETE_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');
    console.log(`Usuario ${employeeNo} eliminado del dispositivo con éxito.`);

    console.log(`Eliminando usuario ${employeeNo} de la base de datos...`);
    const deletedUser = await UserModel.deleteUserByEmployeeNo(employeeNo);
    if (!deletedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado en la base de datos, pero eliminado del dispositivo.' });
    }
    console.log(`Usuario ${employeeNo} eliminado de la base de datos con éxito.`);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente de la base de datos y del dispositivo.',
      data: { employeeNo },
    });
  } catch (error) {
    console.error(`Error al intentar eliminar al usuario ${employeeNo}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar la eliminación del usuario. Revisa los logs del servidor.',
      errors: [{ message: error.message }],
    });
  }

};


/**
 * Guarda la imagen facial de un usuario directamente en la tabla 'users'.
 */
const saveUserDbImage = async (req, res) => {
    const { employeeNo, face_image } = req.body;

    // --- VALIDACIÓN SIMPLE DENTRO DEL CONTROLADOR ---
    if (!employeeNo || !face_image) {
        return res.status(400).json({
            success: false,
            message: 'Faltan datos obligatorios: employeeNo y face_image son requeridos.'
        });
    }

    try {
        const updatedUser = await UserModel.saveDbImage(employeeNo, face_image);
        res.status(200).json({
            success: true,
            message: 'Imagen guardada en la base de datos correctamente.',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al guardar la imagen en la base de datos.',
            error: error.message
        });
    }
};


/**
 * NUEVA FUNCIÓN: Ingreso Diario (Botón Manual)
 * Autoriza a un usuario 'Diaria' y envía el pulso de apertura al dispositivo.
 */
const ingresoDiario = async (req, res) => {
    const { employeeNo } = req.body;
    const doorId = 1; 

    if (!employeeNo) {
        return res.status(400).json({ success: false, message: 'El employeeNo es obligatorio.' });
    }

    try {
        // --- 1. Autorización: Verificar al usuario ---
        const user = await UserModel.searchUserByEmployeeNo(employeeNo);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        if (!user.suscripcion || user.suscripcion.toLowerCase() !== 'diaria') {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Esta función es solo para usuarios con suscripción Diaria.' 
            });
        }
        
        // --- ¡COOLDOWN ELIMINADO! ---

        // --- 2. Acción: Enviar pulso al dispositivo ---
        console.log(`[Ingreso Diario] Enviando pulso de apertura para ${employeeNo} en puerta ${doorId}`);
        
        const url = `${API_URL_REMOTE_DOOR_OPEN}/${doorId}`; 
        
        const xmlPayload = 
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<RemoteControlDoor version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">' +
            '<cmd>open</cmd>' +
            '</RemoteControlDoor>';

        const deviceResponse = await apiService.put(url, API_USERNAME, API_PASSWORD, xmlPayload, 'application/xml');

        if (!deviceResponse || (deviceResponse.statusCode !== 1 && deviceResponse.status !== 200)) {
             console.warn('[Ingreso Diario] El dispositivo no confirmó la apertura o devolvió un error:', deviceResponse);
        }
        
        // --- 3. Registro: Guardar en 'informes' ---
        await logDailyUserAccess(employeeNo, new Date()); 

        // --- 4. Registrar en 'eventos_accesos' (el log general) ---
        const eventData = {
            employee_no: employeeNo,
            nombre: user.name,
            card_no: null,
            timestamp: new Date(),
            door_no: doorId,
            serial_no: Date.now(), // NÚMERO (bigint)
            user_type: user.user_type,
            verify_mode: 'manual', // Indica que fue por el botón
            mask_status: null,
            picture_url: null,
            suscripcion: user.suscripcion
        };
        await insertEvent(eventData); 


        console.log(`[Ingreso Diario] Acceso registrado exitosamente para ${employeeNo}`);
        
        res.status(200).json({ 
            success: true, 
            message: `Acceso concedido y registrado para ${user.name}.`,
            deviceResponse: deviceResponse 
        });

    } catch (error) {
        console.error(`Error en ingresoDiario para ${employeeNo}:`, error.message);
        if (error.response?.data) {
            console.error("Respuesta del dispositivo:", error.response.data);
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor.', error: error.message });
    }
};

// --- 3. ¡NUEVA FUNCIÓN AÑADIDA! ---
/**
 * Obtiene un snapshot (foto) de la cámara del dispositivo.
 */
const getDeviceSnapshot = async (req, res) => {
    
    let firstError = null;
    
    // Intenta obtener la autenticación inicial (necesaria para el 'nonce')
    try {
        await axios.get(API_URL_STREAMING, { responseType: 'arraybuffer' });
    } catch (error) {
        if (error.response && error.response.status === 401) {
            firstError = error; // Guardamos el error 401
        } else {
             console.error('Error (no 401) en la petición inicial de snapshot:', error.message);
             return res.status(500).json({ success: false, message: 'Error de red con el dispositivo.' });
        }
    }

    if (!firstError) {
         console.error('Error de autenticación: No se recibió la respuesta 401 esperada del dispositivo.');
         return res.status(500).json({ success: false, message: 'Error de autenticación (no 401).' });
    }
    
    // --- Autenticación Digest ---
    try {
        console.log(`[Snapshot] Solicitando imagen de ${API_URL_STREAMING}`);
        
        const wwwAuthenticateHeader = firstError.response.headers['www-authenticate'];
        const digestHeader = generateDigestAuthHeader(
            'GET',
            API_URL_STREAMING,
            API_USERNAME,
            API_PASSWORD,
            wwwAuthenticateHeader
        );

        const response = await axios.get(API_URL_STREAMING, {
            headers: { 'Authorization': digestHeader },
            responseType: 'arraybuffer' // ¡Crucial para imágenes!
        });

        // Enviamos la imagen cruda (buffer) al frontend
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
        
    } catch (error) {
        console.error('Error al obtener snapshot del dispositivo:', error.message);
        if (error.response) {
             console.error('Respuesta de error del dispositivo:', error.response.status, error.response.statusText);
        }
        res.status(500).json({
            success: false,
            message: 'Error al obtener snapshot',
            error: error.message,
        });
    }
};

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
  saveUserDbImage,
  ingresoDiario,
  getDeviceSnapshot // <-- ¡Añadida aquí!
};

