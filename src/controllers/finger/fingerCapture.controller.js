const { apiService } = require('../../services/apiServices');

const postUserFingerprint = async (req, res) => {
  try {
    const { API_URL_POST_FINGERPRINT, API_USERNAME, API_PASSWORD } = process.env;
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?><CaptureFingerPrintCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><fingerNo>1</fingerNo></CaptureFingerPrintCond>`;

    const data = await apiService.post(API_URL_POST_FINGERPRINT, API_USERNAME, API_PASSWORD, xmlData);
    res.json(data);
    console.log('Huella xml: ', data);
  } catch (error) {
    res.status(500).send('Error al obtener el registro de la huella');
  }
};

module.exports = { postUserFingerprint };
