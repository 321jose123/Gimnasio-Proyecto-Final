const {apiService, apiServiceImage} = require('../../services/apiServices');
const sharp = require('sharp');

const getUserCapabilities = async (req, res) => {
  try {
    const apiUrl = process.env.API_URL_INFORMACION_CONFIGURACION_USUARIO;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;
    const data = await apiService.get(apiUrl, username, password);
    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener capacidades del usuario');
  }

};

const postUserFingerprint = async (req, res) => {
    try {
        const apiUrl = process.env.API_URL_POST_FINGERPRINT;
        const username = process.env.API_USERNAME;
        const password = process.env.API_PASSWORD;

        const xmlData = `<?xml version="1.0" encoding="UTF-8"?> <CaptureFingerPrintCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"> <fingerNo>1</fingerNo> </CaptureFingerPrintCond>`;
        const data = await apiService.post(apiUrl, username, password, xmlData);
        res.json(data);
        console.log("Huella xml: ",data);
       
    } catch (error) {
        res.status(500).send('Error al obtener el registro de la huella');
    }
}

const getChannelPicture = async (req, res) => {
  try {
    const apiUrl = process.env.API_URL_GET_PICTURE;
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;
    const data = await apiServiceImage.get(apiUrl, username, password);
    console.log(data);

    res.set('Content-Type', 'image/jpeg');
    res.send(data);

  } catch (error) {
    res.status(500).send(`Error al obtener la imagen del canal: ${error.message}`);
  }
}

module.exports = {
  getUserCapabilities,
  getChannelPicture,
  postUserFingerprint
};
