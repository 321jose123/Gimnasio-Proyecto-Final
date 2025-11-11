const { apiServiceImage } = require('../../services/apiServices');

const getChannelPicture = async (req, res) => {
  try {
    const { API_URL_GET_PICTURE, API_USERNAME, API_PASSWORD } = process.env;
    const data = await apiServiceImage.get(API_URL_GET_PICTURE, API_USERNAME, API_PASSWORD);

    res.set('Content-Type', 'image/jpeg');
    res.send(data);
  } catch (error) {
    res.status(500).send(`Error al obtener la imagen del canal: ${error.message}`);
  }
};

module.exports = { getChannelPicture };
