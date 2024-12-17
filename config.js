require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://192.168.1.7';

module.exports = {
  API_URL_INFORMACION_CONFIGURACION_USUARIO: `${BASE_URL}/ISAPI/AccessControl/UserInfo/capabilities?format=json`,
  API_URL_GET_PICTURE: `${BASE_URL}/ISAPI/Streaming/channels/101/picture`,
  API_URL_POST_FINGERPRINT: `${BASE_URL}/ISAPI/AccessControl/CaptureFingerPrint`,
  API_URL_GET_CARD_ID: `${BASE_URL}/ISAPI/AccessControl/CaptureCardInfo?format=json`,
  API_URL_DELETE_CARD: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Delete?format=json`,
  API_URL_ADD_CARD_TO_USER: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Record?format=json`,
};
