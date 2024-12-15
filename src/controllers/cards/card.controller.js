const { apiService } = require('../../services/apiServices');

const getUserCardId = async (req, res) => {
  try {
    const { API_URL_GET_CARD_ID, API_USERNAME, API_PASSWORD } = process.env;
    const data = await apiService.get(API_URL_GET_CARD_ID, API_USERNAME, API_PASSWORD);
    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener el registro de tarjeta');
  }
};

const deleteUsercard = async (req, res) => {
  try {
    const { employeeNo } = req.body;
    if (!employeeNo) {
      return res.status(400).send('Parametro employeeNo es requerido');
    }

    const { API_URL_DELETE_CARD, API_USERNAME, API_PASSWORD } = process.env;
    const jsonData = {
      CardInfoDelCond: {
        EmployeeNoList: [{ employeeNo }],
        operateType: 'byTerminal',
        terminalNoList: [1],
      },
    };

    const data = await apiService.put(API_URL_DELETE_CARD, API_USERNAME, API_PASSWORD, jsonData);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el registro de tarjeta');
  }
};

module.exports = { getUserCardId, deleteUsercard };
