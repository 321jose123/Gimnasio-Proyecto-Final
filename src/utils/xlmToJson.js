const { parseStringPromise } = require('xml2js');

const convertXmlToJson = async (xmlData) => {
  try {
    const jsonData = await parseStringPromise(xmlData);
    return jsonData;
  } catch (error) {
    console.error('Error al convertir XML a JSON:', error);
    throw new Error('Error en la conversión de XML a JSON');
  }
};

module.exports = {
  convertXmlToJson,
};
