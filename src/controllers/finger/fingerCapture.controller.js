const { apiService } = require('../../services/apiServices');
const { convertXmlToJson } = require('../../utils/xlmToJson');
const { API_URL_POST_FINGERPRINT, API_URL_ASSIGN_FINGERPRINT } = require('../../../config')

const postUserFingerprint = async (req, res) => {
  const { fingerNo } = req.body;

  try {
    const { API_USERNAME, API_PASSWORD } = process.env;

    const dataParse = `<?xml version="1.0" encoding="UTF-8"?>
      <CaptureFingerPrintCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
        <fingerNo>${fingerNo}</fingerNo>
      </CaptureFingerPrintCond>`;

    const data = await apiService.post(API_URL_POST_FINGERPRINT, API_USERNAME, API_PASSWORD, dataParse, contentType = 'application/xml');

    const jsonResponse = await convertXmlToJson(data);

    res.json(jsonResponse);
  } catch (error) {
    console.error('Error in postUserFingerprint:', error);
    res.status(500).send('Error al obtener el registro de la huella');
  }
};

const addFingertoUser = async (req, res) => {
  const { FingerPrintCfg } = req.body;

  try {
    const { API_USERNAME, API_PASSWORD } = process.env;
    const assignBody = {
      FingerPrintCfg: {
        employeeNo: FingerPrintCfg.employeeNo,
        enableCardReader: [1],
        fingerPrintID: FingerPrintCfg.fingerPrintID,
        deleteFingerPrint: false,
        fingerType: "normalFP",
        fingerData: FingerPrintCfg.fingerData,
        leaderFP: [1],
        checkEmployeeNo: false
      }
    };

    const assignResponse = await apiService.post(
      API_URL_ASSIGN_FINGERPRINT,
      API_USERNAME,
      API_PASSWORD,
      assignBody,
      'application/json'
    );

    res.json({ message: 'Huella asignada exitosamente', data: assignResponse });
  } catch (error) {
    console.error('Error en addFingertoUser:', error);
    res.status(500).json({ message: 'Error al asignar la huella', error: error.message });
  }
};




module.exports = { postUserFingerprint, addFingertoUser };
