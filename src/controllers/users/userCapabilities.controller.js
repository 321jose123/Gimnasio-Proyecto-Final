const { apiService } = require('../../services/apiServices');

const getUserCapabilities = async (req, res) => {
  try {
    const { API_URL_INFORMACION_CONFIGURACION_USUARIO, API_USERNAME, API_PASSWORD } = process.env;
    const data = await apiService.get(API_URL_INFORMACION_CONFIGURACION_USUARIO, API_USERNAME, API_PASSWORD);
    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener capacidades del usuario');
  }
};

module.exports = { getUserCapabilities };
