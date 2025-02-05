require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://192.168.1.11';

module.exports = {

  //TODO: CONEXIÓN CON DATABASE CONFIG
  db_host: '192.168.1.61',
  db_port: 5432,
  db_user: 'postgres',
  db_password: '2520',
  db_database: 'DB_HK_CSE',

    //TODO: ENDPOINTS DE USUARIOS CONEXIÓN CON MAQUINA

    //TODO: ENDPOINTS INFORMACIÓN REGLAS DEL SISTEMA
    API_URL_INFORMACION_CONFIGURACION_USUARIO: `${BASE_URL}/ISAPI/AccessControl/UserInfo/capabilities?format=json`,

    //TODO: INFORMACIÓN USUARIO

    API_URL_ADD_USER: `${BASE_URL}/ISAPI/AccessControl/UserInfo/Record?format=json`,
    API_URL_DELETE_USER : `${BASE_URL}/ISAPI/AccessControl/UserInfo/Delete?format=json`,
    API_URL_SEARCH_USER : `${BASE_URL}/ISAPI/AccessControl/UserInfo/Search?format=json`,

    //TODO: ENDPOINTS HUELLA

    API_URL_POST_FINGERPRINT: `${BASE_URL}/ISAPI/AccessControl/CaptureFingerPrint`,
    API_URL_ASSIGN_FINGERPRINT: `${BASE_URL}/ISAPI/AccessControl/FingerPrintDownload?format=json`,

    //TODO: ENDPONTS TARJETA

    API_URL_GET_CARD_ID: `${BASE_URL}/ISAPI/AccessControl/CaptureCardInfo?format=json`,
    API_URL_DELETE_CARD: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Delete?format=json`,
    API_URL_ADD_CARD_TO_USER: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Record?format=json`,
    API_URL_GET_CARD_FROM_USER: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Search?format=json`,

    //TODO: ENDPONTS VIDEO E IMAGEN
    API_URL_STREAMING : `${BASE_URL}/ISAPI/Streaming/channels/101/picture`,
    API_URL_UPDATE_USER_PROFILE_IMAGE : `${BASE_URL}/ISAPI/Intelligent/FDLib/FDSetUp?format=json`
};
