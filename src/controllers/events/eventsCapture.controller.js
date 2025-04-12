const { API_URL_DEVICE_EVENTS } = require('../../../config');
const { apiService } = require('../../services/apiServices');
const { insertEvent, getAllEvents } = require('../../models/events/events.models');
const { getUserAccessCount, decrementUserAccess, getUserDailyAccessCount, decrementUserDailyAccess } = require('../../models/users/user.model');
const { API_USERNAME, API_PASSWORD } = process.env;

const searchID = `consulta_eventos`;

const { DateTime } = require("luxon");
const { handleInvalidEvent } = require('../cards/card.controller');

const ahora = DateTime.now().setZone("America/Bogota");
const inicioDia = ahora.startOf("day").toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
const finDia = ahora.endOf("day").toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

const hora_inicio_utc = inicioDia;
const hora_final_utc = finDia;



const eventsCapture = async (req, res) => {
    try {
        const jsondata = {
            "AcsEventCond": {
                "searchID": searchID,
                "searchResultPosition": 0,
                "maxResults": 100,
                "major": 0,
                "minor": 0,
                "startTime": hora_inicio_utc,
                "endTime": hora_final_utc,
                "timeReverseOrder": true
            }
        };

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

        if (eventsUserCapture?.AcsEvent?.InfoList) {
            const eventosValidos = eventsUserCapture.AcsEvent.InfoList.filter(evento => evento.employeeNoString);

            const eventosInvalidos = eventsUserCapture.AcsEvent.InfoList.filter(evento => !evento.employeeNoString);

            const eventosConTarjeta = new Set();

            for (const evento of eventosValidos) {
                const eventInserted = await insertEvent({
                    employee_no: evento.employeeNoString,
                    nombre: evento.name,
                    card_no: evento.cardNo || null,
                    timestamp: evento.time,
                    door_no: evento.doorNo,
                    serial_no: evento.serialNo,
                    user_type: evento.userType || null,
                    verify_mode: evento.currentVerifyMode || null,
                    mask_status: evento.mask || null,
                    picture_url: evento.pictureURL || null
                });

                if (!eventInserted) {
                    continue;
                }

                const accesosDisponibles = await getUserAccessCount(evento.employeeNoString);
                const accesosDiarios = await getUserDailyAccessCount(evento.employeeNoString);


                if (accesosDiarios > 0) {
                    // Si hay accesos diarios disponibles

                    if (accesosDisponibles > 0) {
                        console.log(`✅ Usuario ${evento.employeeNoString} tiene ${accesosDisponibles} accesos disponibles y ${accesosDiarios} accesos diarios.`);

                        // Descontar ambos tipos de acceso
                        await decrementUserAccess(evento.employeeNoString);
                        await decrementUserDailyAccess(evento.employeeNoString);

                        console.log(`🔽 Se descontó 1 acceso al usuario ${evento.employeeNoString}. Le quedan ${accesosDisponibles - 1}.`);
                        console.log(`🔽 Se descontó 1 acceso diario al usuario ${evento.employeeNoString}. Le quedan ${accesosDiarios - 1}.`);
                    } else {
                        console.log(`⛔ Usuario ${evento.employeeNoString} tiene accesos diarios pero no disponibles. Solo se descuenta acceso diario.`);
                        // Solo descontar acceso diario
                        await decrementUserDailyAccess(evento.employeeNoString);
                        console.log(`🔽 Se descontó 1 acceso diario al usuario ${evento.employeeNoString}. Le quedan ${accesosDiarios - 1}.`);
                    }
                } else {
                    console.log(`⛔ Usuario ${evento.employeeNoString} no tiene accesos diarios disponibles. No se descuenta ningún acceso.`);
                }
            }

            for (const evento of eventosInvalidos) {
                if (evento.cardNo) {
                    eventosConTarjeta.add(evento.cardNo);
                }
            }

            handleInvalidEvent(eventosConTarjeta);

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

const getAllEventsCapture = async (req, res) => {
    try {
        const events = await getAllEvents();
        return res.status(200).json({
            status: 'success',
            message: 'Mostrando lista de eventos capturados',
            totalEventos: events.length,
            eventos: events
        });
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
    getAllEventsCapture
};
