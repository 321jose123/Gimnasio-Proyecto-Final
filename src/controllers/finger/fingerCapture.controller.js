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

  // 1. Preparamos el cuerpo de la petición
  const assignBody = {
    FingerPrintCfg: {
      employeeNo: FingerPrintCfg.employeeNo,
      enableCardReader: [1],
      fingerPrintID: FingerPrintCfg.fingerPrintID || 1,
      deleteFingerPrint: false,
      fingerType: "normalFP",
      fingerData: FingerPrintCfg.fingerData,
      leaderFP: [1],
      checkEmployeeNo: true
    }
  };

  // 2. Log para saber qué estamos enviando
  console.log("Enviando este payload para asignar huella:", JSON.stringify(assignBody, null, 2));

  try {
    const { API_USERNAME, API_PASSWORD } = process.env;

    // 3. Hacemos la llamada a la API
    const assignResponse = await apiService.post(
      API_URL_ASSIGN_FINGERPRINT,
      API_USERNAME,
      API_PASSWORD,
      assignBody,
      'application/json'
    );

    // =================================================================
    //  👇 ¡AQUÍ ESTÁ LA VERIFICACIÓN CRUCIAL QUE TE FALTA! 👇
    // =================================================================
    
    // Hikvision usa '1' (string o número) para indicar éxito real
    if (assignResponse?.statusCode == 1) {
      
      // === ÉXITO REAL ===
      console.log(`✅ Huella asignada correctamente al usuario ${FingerPrintCfg.employeeNo} en el dispositivo.`);
      res.status(200).json({ 
        message: 'Huella asignada exitosamente', 
        data: assignResponse 
      });

    } else {
      
      // === FALLO SILENCIOSO (AHORA VISIBLE) ===
      // El dispositivo nos dio HTTP 200, pero la operación falló.
      console.error(`❌ ERROR: El dispositivo RECHAZÓ la huella para ${FingerPrintCfg.employeeNo}.`);
      console.error("Respuesta del dispositivo:", JSON.stringify(assignResponse, null, 2));
      
      // Enviamos el error real al frontend
      res.status(400).json({ 
          message: "El dispositivo rechazó la huella.",
          error: assignResponse?.ResponseStatus?.statusString || "Error desconocido del dispositivo",
          deviceResponse: assignResponse
      });
    }
    
  } catch (error) {
    // === FALLO DE RED/AUTENTICACIÓN (Error 401, 404, 500, etc.) ===
    // Si entramos aquí, es porque la petición ni siquiera llegó bien al dispositivo.
    console.error('Error (catch) detallado en addFingertoUser:', error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.statusString || error.message;
    res.status(500).json({ 
      message: 'Error de red/autenticación al asignar la huella', 
      error: errorMessage 
    });
  }
};



module.exports = { postUserFingerprint, addFingertoUser };
