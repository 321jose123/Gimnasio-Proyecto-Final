const { HORARIO_EMPRESA_INICIO, HORARIO_EMPRESA_FIN, API_URL_DEVICE_EVENTS } = require('../../../config');
const { formatToUTC } = require('../../helpers/validate.helpers');
const { apiService } = require('../../services/apiServices');

const { API_USERNAME, API_PASSWORD } = process.env;

const hora_inicio = `${new Date().toISOString().split('T')[0]}T${HORARIO_EMPRESA_INICIO}`;
const hora_final = `${new Date().toISOString().split('T')[0]}T${HORARIO_EMPRESA_FIN}`;

const hora_inicio_utc = formatToUTC(hora_inicio);
const hora_final_utc = formatToUTC(hora_final);

/**
 * Captura los eventos del dispositivo desde la hora de inicio del horario de la empresa hasta la hora final del horario de la empresa.
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object>} - Objeto de respuesta con la lista de eventos capturados.
 * @throws {Error} - Si hay un error al capturar eventos del dispositivo.
 */
const eventsCapture = async (req, res) => {
    try {
        const jsondata = {
            "AcsEventCond": {
                "searchID": "prueba",
                "searchResultPosition": 0,
                "maxResults": 10,
                "major": 0,
                "minor": 0,
                "startTime": hora_inicio_utc,
                "endTime": hora_final_utc,
                "timeReverseOrder": true
            }
        };

        console.log("Solicitud enviada a la API:", jsondata);

        let eventsUserCapture;
        try {
            eventsUserCapture = await apiService.post(API_URL_DEVICE_EVENTS, API_USERNAME, API_PASSWORD, jsondata, "application/json");
        } catch (error) {
            console.error("Error al capturar eventos del dispositivo:", error);
            return res.status(500).json({ 
                message: 'Error capturando evento en dispositivo',
                status: 'error',
                error: error.message,
            });
        }

        if (eventsUserCapture && eventsUserCapture.AcsEvent && eventsUserCapture.AcsEvent.InfoList) {

            const eventosValidos = eventsUserCapture.AcsEvent.InfoList.filter(evento => evento.employeeNoString);

            const eventosInvalidos = eventsUserCapture.AcsEvent.InfoList.filter(evento => !evento.employeeNoString);

            return res.status(200).json({ 
                status: 'success',
                message: 'Mostrando lista de eventos capturados',
                totalEventos: eventsUserCapture.AcsEvent.InfoList.length,
                eventosValidos: {
                    total: eventosValidos.length,
                    data: eventosValidos
                },
                eventosInvalidos: {
                    total: eventosInvalidos.length,
                    data: eventosInvalidos
                }
            });
        } else {
            return res.status(200).json({
                status: 'success',
                message: 'No hay eventos registrados para el rango de tiempo solicitado.',
                totalEventos: 0,
                eventosValidos: { total: 0, data: [] },
                eventosInvalidos: { total: 0, data: [] }
            });
        }

    } catch (error) {
        console.error("Error en el proceso de captura:", error);
        res.status(500).json({ 
            message: 'Error general en la captura de eventos',
            status: 'error',
            error: error.message,
        });
    }
};

module.exports = {
    eventsCapture,
};
