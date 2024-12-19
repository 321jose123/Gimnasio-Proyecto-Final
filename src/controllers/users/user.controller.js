const { apiService } = require('../../services/apiServices');
const { API_URL_INFORMACION_CONFIGURACION_USUARIO } = require('../../../config');
const { API_URL_DELETE_USER } = require('../../../config');

const { API_USERNAME, API_PASSWORD } = process.env;

const getUserCapabilities = async (req, res) => {
  try {
    const data = await apiService.get(API_URL_INFORMACION_CONFIGURACION_USUARIO, API_USERNAME, API_PASSWORD);
    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener capacidades del usuario');
  }
};

const deleteUser = async (req, res) => {

  const {employeeNo} = req.body;

  try {

    const jsonData = {
        UserInfoDelCond:{
            EmployeeNoList:[{
                employeeNo: employeeNo
            }],
            operateType: "byTerminal",
            "terminalNoList": [1]
        }
    }

    const data = await apiService.put(API_URL_DELETE_USER, API_USERNAME, API_PASSWORD, jsonData, contentType= 'application/json');

    res.json(data);

  } catch (error) {
    res.status(500).send('Error al eliminar usuario', error);
  }

}

module.exports = {
  getUserCapabilities,
  deleteUser
};
