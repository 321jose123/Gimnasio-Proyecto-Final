const { apiService } = require('../../services/apiServices');
const { convertXmlToJson } = require('../../utils/xlmToJson');

const postUserFingerprint = async (req, res) => {
  const { fingerNo } = req.body;
  
  try {
    const { API_URL_POST_FINGERPRINT, API_USERNAME, API_PASSWORD } = process.env;

    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
      <CaptureFingerPrintCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
        <fingerNo>${fingerNo}</fingerNo>
      </CaptureFingerPrintCond>`;

    const data = await apiService.post(API_URL_POST_FINGERPRINT, API_USERNAME, API_PASSWORD, xmlData);

    const jsonResponse = await convertXmlToJson(data);

    const fingerData = jsonResponse.CaptureFingerPrint.fingerData[0];
    const fingerId = jsonResponse.CaptureFingerPrint.fingerNo[0];
    const fingerPrintQuality = jsonResponse.CaptureFingerPrint.fingerPrintQuality[0];


    console.info(' Huella:', fingerId, 'obtenida satisfactoriamente. \n', 
      'Datos de la huella: ', fingerData, '\n',
      'Calidad de la huella:', fingerPrintQuality, '\n',
    );

    res.json(jsonResponse);
  } catch (error) {
    console.error('Error in postUserFingerprint:', error);
    res.status(500).send('Error al obtener el registro de la huella');
  }
};

module.exports = { postUserFingerprint };
