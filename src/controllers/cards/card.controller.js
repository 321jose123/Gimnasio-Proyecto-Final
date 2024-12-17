const { apiService } = require('../../services/apiServices');
const { API_URL_DELETE_CARD, API_URL_GET_CARD_ID, API_URL_ADD_CARD_TO_USER } = require('../../../config')

const getUserCardId = async (req, res) => {
  try {
    const { API_USERNAME, API_PASSWORD } = process.env;
    const data = await apiService.get(API_URL_GET_CARD_ID, API_USERNAME, API_PASSWORD);

    const cardNumber = data.CardInfo.cardNo;

    console.info(' Tarjeta número:', cardNumber, 'obtenida satisfactoriamente. \n', JSON.stringify(data, null, 2));

    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener el registro de tarjeta');
  }
};

const addCardToUser = async (req, res) => {
  const { employeeNo, cardNo, deleteCard, cardType, checkCardNo, checkEmployeeNo, addCard } = req.body;
  try {
    const { API_USERNAME, API_PASSWORD } = process.env;

    const dataParse = {
      CardInfo: {
        employeeNo: employeeNo,
        cardNo: cardNo,
        deleteCard: deleteCard,
        cardType: cardType,
        checkCardNo: checkCardNo,
        checkEmployeeNo: checkEmployeeNo,
        addCard: addCard,
        operateType: 'byTerminal',
        terminalNoList: [1],
        }
    };
    

    const data = await apiService.post(API_URL_ADD_CARD_TO_USER, API_USERNAME, API_PASSWORD, dataParse, 'application/json');
    console.log(employeeNo);
    res.json(data);
  } catch (error) {
    return res.status(500).send('Error al actualizar el registro de tarjeta');
  }
}

const deleteUsercard = async (req, res) => {
  try {
    const { employeeNo } = req.body;

    const {  API_USERNAME, API_PASSWORD } = process.env;
    const jsonData = {
      CardInfoDelCond: {
        EmployeeNoList: [{ employeeNo }],
        operateType: 'byTerminal',
        terminalNoList: [1],
      },
    };

    const data = await apiService.put(API_URL_DELETE_CARD, API_USERNAME, API_PASSWORD, jsonData);
    console.info(' Tarjeta número:', employeeNo, 'eliminada satisfactoriamente. \n', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el registro de tarjeta');
  }
};

module.exports = { getUserCardId, deleteUsercard, addCardToUser };
