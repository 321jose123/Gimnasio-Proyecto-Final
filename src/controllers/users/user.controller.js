const { apiService } = require('../../services/apiServices');
const axios = require('axios');
const { API_URL_INFORMACION_CONFIGURACION_USUARIO, API_URL_DELETE_USER, API_URL_ADD_USER, API_URL_SEARCH_USER } = require('../../../config');

const { API_USERNAME, API_PASSWORD } = process.env;

const searchUser = async (req, res) => {
    try {
      const {
        searchID = "UserSearch",
        searchResultPosition = 0,
        maxResults = 1,
        EmployeeNoList = [],
        fuzzySearch = "",
        userType = "normal",
      } = req.body;

      const jsonData = {
        UserInfoSearchCond: {
          searchID,
          searchResultPosition,
          maxResults,
          EmployeeNoList: EmployeeNoList.map((employeeNo) => ({ employeeNo })),
          fuzzySearch,
          userType,
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
  try {
    const {
      searchID = "UserSearch",
      searchResultPosition = 0,
      maxResults = 1,
      EmployeeNoList = [],
    } = req.body;

    const jsonData = {
      UserInfoSearchCond: {
        searchID,
        searchResultPosition,
        maxResults,
        EmployeeNoList: EmployeeNoList.map((employeeNo) => ({ employeeNo })),
      },
    };

    

    const data = await apiService.post(API_URL_SEARCH_USER, API_USERNAME, API_PASSWORD, jsonData, "application/json");

    const { UserInfoSearch } = data;
    console.log(JSON.stringify(UserInfoSearch));
    const { responseStatusStrg } = UserInfoSearch || {};
    console.log(`responseStatusStrg: ${responseStatusStrg}`);

    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener capacidades del usuario');
  }
};


const addUserInfo = async (req, res) => {

  const { employeeNo, name, userType, Valid, doorRight , localUIUserType, checkUser, addUser, gender } = req.body;

  const { beginTime, endTime } = Valid || {};
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
        Valid: {
          enable: true,
          beginTime: beginTimeUTC,
          endTime: endTimeUTC,
        },
        doorRight: doorRight,
        localUIUserType: localUIUserType,
        userVerifyMode: "cardOrFaceOrFp",
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
