require('dotenv').config();

// --- LECTURA DE VARIABLES DE ENTORNO ---
const BASE_URL = process.env.BASE_URL;
const SYNC_KEY = process.env.SYNC_KEY === 'true';

// --- CAMBIO CLAVE: LEEMOS LAS CREDENCIALES DEL DISPOSITIVO ---
const API_USERNAME = process.env.API_USERNAME;
const API_PASSWORD = process.env.API_PASSWORD;

const DB_HOST = process.env.DATABASE_URL;
const DB_PORT = process.env.DATABASE_PORT;
const DB_USER = process.env.DATABASE_USERNAME;
const DB_PASSWORD = process.env.DATABASE_PASSWORD;
const DB_DATABASE = process.env.DATABASE_NAME;


// --- EXPORTACIÓN DE LA CONFIGURACIÓN ---
module.exports = {
  //* INICIAR SINCRONIZACIÓN
  START_SYNC: SYNC_KEY,
  //* TIEMPO DE SINCRONIZACIÓN (en segundos)
  TIME_SYNC: 10,
  //* CONEXIÓN CON LA BASE DE DATOS
  db_host: DB_HOST,
  db_port: DB_PORT,
  db_user: DB_USER,
  db_password: DB_PASSWORD,
  db_database: DB_DATABASE,
  //* HORARIO DE LA EMPRESA
  HORARIO_EMPRESA_INICIO: '00:00:00',
  HORARIO_EMPRESA_FIN: '23:59:59',

  // --- CAMBIO CLAVE: EXPORTAMOS LAS CREDENCIALES ---
  API_USERNAME: API_USERNAME,
  API_PASSWORD: API_PASSWORD,

  // --- ENDPOINTS DEL DISPOSITIVO HIKVISION ---
  API_URL_DEVICE_EVENTS: `${BASE_URL}/ISAPI/AccessControl/AcsEvent?format=json`,
  API_URL_INFORMACION_CONFIGURACION_USUARIO: `${BASE_URL}/ISAPI/AccessControl/UserInfo/capabilities?format=json`,
  API_URL_ADD_USER: `${BASE_URL}/ISAPI/AccessControl/UserInfo/Record?format=json`,
  API_URL_UPDATE_USER: `${BASE_URL}/ISAPI/AccessControl/UserInfo/Modify?format=json`,
  API_URL_DELETE_USER: `${BASE_URL}/ISAPI/AccessControl/UserInfo/Delete?format=json`,
  API_URL_SEARCH_USER: `${BASE_URL}/ISAPI/AccessControl/UserInfo/Search?format=json`,
  API_URL_POST_FINGERPRINT: `${BASE_URL}/ISAPI/AccessControl/CaptureFingerPrint`,
  API_URL_ASSIGN_FINGERPRINT: `${BASE_URL}/ISAPI/AccessControl/FingerPrintDownload?format=json`,
  API_URL_GET_CARD_ID: `${BASE_URL}/ISAPI/AccessControl/CaptureCardInfo?format=json`,
  API_URL_DELETE_CARD: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Delete?format=json`,
  API_URL_ADD_CARD_TO_USER: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Record?format=json`,
  API_URL_GET_CARD_FROM_USER: `${BASE_URL}/ISAPI/AccessControl/CardInfo/Search?format=json`,
  API_URL_STREAMING: `${BASE_URL}/ISAPI/Streaming/channels/101/picture`,
  API_URL_UPDATE_USER_PROFILE_IMAGE: `${BASE_URL}/ISAPI/Intelligent/FDLib/FDSetUp?format=json`,
  API_URL_REMOTE_DOOR_OPEN: `${BASE_URL}/ISAPI/AccessControl/RemoteControl/door`
};