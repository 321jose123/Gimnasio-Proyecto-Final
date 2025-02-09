const { HORARIO_EMPRESA_INICIO, HORARIO_EMPRESA_FIN } = require('../../../config');
const { formatToUTC } = require('../../helpers/validate.helpers');
const { apiService } = require('../../services/apiServices');
const { API_URL_DEVICE_EVENTS } = require('../../../config');

const { API_USERNAME, API_PASSWORD } = process.env;

const hora_inicio = `${new Date().toISOString().split('T')[0]}T${HORARIO_EMPRESA_INICIO}`;
const hora_final = `${new Date().toISOString().split('T')[0]}T${HORARIO_EMPRESA_FIN}`;

const hora_inicio_utc = formatToUTC(hora_inicio);
const hora_final_utc = formatToUTC(hora_final);

const eventsCapture = async (req, res) => {
    const fecha_inicio = hora_inicio
    const fecha_final = hora_final

    try {
        const jsondata = {
            AcsEventCond: {
                searchID,
                searchResultPosition,
                maxResults,
                major,
                minor,
                startTime,
                endTime,
                timeReverseOrder
            }
        } = {
            "AcsEventCond": {
                "searchID": "prueba",
                "searchResultPosition": 0,
                "maxResults": 24,
                "major": 0,
                "minor": 0,
                "startTime": hora_inicio_utc,
                "endTime": hora_final_utc,
                "timeReverseOrder": true
            }
        };

        console.log(jsondata);
        

        let eventsUserCapture;
        try {
            eventsUserCapture = await apiService.post(API_URL_DEVICE_EVENTS, API_USERNAME, API_PASSWORD, jsondata, "aplication/json");
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                message: 'Error capturando evento en dispositivo',
                status: 'error',
                error: error.message,
            });
        }

        res.status(200).json({ 
            status: 'success',
            message: 'Mostrando lista de eventos capturados',
            data: eventsUserCapture,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Error capturing event',
            status: 'error',
            error: error.message,
        });
    }


};

module.exports = {
    eventsCapture,
}