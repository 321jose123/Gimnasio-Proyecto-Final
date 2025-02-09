const { apiService } = require('../../services/apiServices');
const { API_URL_DELETE_CARD, API_URL_GET_CARD_ID, API_URL_ADD_CARD_TO_USER, API_URL_GET_CARD_FROM_USER } = require('../../../config');
const { saveCardToUser, getCardFromUser, deleteCardFromUser } = require('../../models/cards/cards.models');

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

    try {
      const card = await saveCardToUser(employeeNo, cardNo, deleteCard, cardType, checkCardNo, checkEmployeeNo, addCard);
      res.json(card);
    } catch (error) {
      res.status(500).send('Error al agregar la tarjeta al usuario' + error);
    }

  } catch (error) {
    res.status(500).send('Error al actualizar el registro de tarjeta' + error);
  }
}

const getCardIdFromUser = async (req, res) => {
  const { searchResultPosition, maxResults, employeeNo } = req.body;

  try {
    console.log('searchResultPosition: ', searchResultPosition, 'maxResults: ', maxResults, 'employeeNo: ', employeeNo);
    const { API_USERNAME, API_PASSWORD } = process.env;
    const jsonData = {
      CardInfoSearchCond: {
        searchId: 'searchID',
        searchResultPosition: searchResultPosition,
        maxResults: maxResults,
        EmployeeNoList: [
          {
            employeeNo: employeeNo
          }
        ]
      },
    };

    console.log(jsonData);

    const data = await apiService.post(API_URL_GET_CARD_FROM_USER, API_USERNAME, API_PASSWORD, jsonData, 'application/json');

    res.json(data);
  } catch (error) {
    console.error('Error en la busqueda de tarjeta del usuario:', employeeNo, error);
  }

}

const deleteUsercard = async (req, res) => {
  try {
    const { employeeNo } = req.body;

    const { API_USERNAME, API_PASSWORD } = process.env;
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

module.exports = { 
  getUserCardId, 
  deleteUsercard, 
  addCardToUser, 
  getCardIdFromUser 
};
