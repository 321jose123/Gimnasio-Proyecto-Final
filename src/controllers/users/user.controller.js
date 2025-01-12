const { apiService, apiServiceImage } = require('../../services/apiServices');
const { API_URL_INFORMACION_CONFIGURACION_USUARIO, API_URL_DELETE_USER, API_URL_ADD_USER, API_URL_SEARCH_USER, API_URL_UPDATE_USER_PROFILE_IMAGE } = require('../../../config');
const fs = require('fs');
const path = require('path');

const { API_USERNAME, API_PASSWORD } = process.env;

const searchUser = async (req, res) => {
    try {
      const {
        EmployeeNoList = [],
        fuzzySearch = "",
      } = req.body;

      console.log("Request body:✅", req.body);
      

      const jsonData = {
        UserInfoSearchCond: {
          searchID: "UserSearchCond",
          searchResultPosition: 0,
          maxResults: 1,
          EmployeeNoList: EmployeeNoList.map((employeeNo) => ({ employeeNo })),
          fuzzySearch,
          userType: "normal",
        },
      };

      const data = await apiService.post(API_URL_SEARCH_USER, API_USERNAME, API_PASSWORD, jsonData, "application/json");

      res.status(200).json({ message: "Busqueda de usuario", data: data });
    } catch (err) {
      res.status(500).json({
        message: "Error al buscar usuario",
        error: err.message,
        data: err.response?.data,
      });    }
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
  console.log('Request body:✅', req.body);

  try {
    const { EmployeeNoList = [], img64 } = req.body;

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


const addUserInfo = async (req, res) => {

  const { employeeNo, name, userType, Valid, doorRight , localUIUserType, checkUser, addUser, gender, userVerifyMode, RightPlan } = req.body;
  
  const { beginTime, endTime } = Valid || {};
  const [{ doorNo, planTemplateNo }] = RightPlan || [];
  if (beginTime && endTime && new Date(beginTime) > new Date(endTime)) {
    return res.status(400).json({ message: 'La fecha de inicio debe ser menor que la fecha de fin' });
  }


  const formatToUTC = (date) => {
    const d = new Date(date);
    console.log(`beginTime (ISO): ${d.toISOString()}`);
    return new Date(Date.UTC(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    )).toISOString().split('.')[0];
  };

  const beginTimeUTC = formatToUTC(beginTime);
  const endTimeUTC = formatToUTC(endTime);
  console.log(`beginTime (UTC): ${beginTimeUTC}`);
  console.log(`endTime (UTC): ${endTimeUTC}`);

  console.log(req.body);

  try {

    const jsonData = {
      UserInfo: {
        employeeNo: employeeNo,
        name: name,
        userType: userType,
        doorRight: doorRight,
        Valid: {
          enable: true,
          beginTime: beginTimeUTC,
          endTime: endTimeUTC,
        },
        RightPlan: [
          {
            doorNo: doorNo,
            planTemplateNo: planTemplateNo
          }
        ],
        localUIUserType: localUIUserType,
        userVerifyMode: userVerifyMode,
        checkUser: checkUser,
        addUser: addUser,
        gender: gender
      }
    }

    const response = await apiService.post(API_URL_ADD_USER, API_USERNAME, API_PASSWORD, jsonData, contentType = 'application/json');

    res.status(200).json({ message: 'Usuario agregado exitosamente', data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar el usuario', error: error.message, data: error.response?.data });
  }
};

const deleteUser = async (req, res) => {

  const { employeeNo } = req.body;

  try {

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
  updateUserFace
};
