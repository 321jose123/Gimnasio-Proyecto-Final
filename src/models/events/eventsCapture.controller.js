const { API_URL_DEVICE_EVENTS, API_USERNAME, API_PASSWORD } = require('../../../config');
const { apiService } = require('../../services/apiServices');
const { DateTime } = require("luxon");

// --- IMPORTACIONES CLAVE ---
const { decrementTicketAccess } = require('../../models/users/access.model');
const { getUserAccessCount, decrementUserAccess, getUserDailyAccessCount, decrementUserDailyAccess } = require('../../models/users/user.model');
const { insertEvent } = require('../../models/events/events.models'); 
const { handleInvalidEvent } = require('../cards/card.controller');

// --- NUEVA IMPORTACIÓN ---
// Necesitas el cliente de la BD para buscar la suscripción
const { client } = require('../../../db/databasepg'); 

const eventsCapture = async (req, res) => {
    const ahora = DateTime.now().setZone("America/Bogota");
    const inicioDia = ahora.startOf("day").toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
    const finDia = ahora.endOf("day").toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

    try {
        const jsondata = {
            "AcsEventCond": { "searchID": `sync_${Date.now()}`, "searchResultPosition": 0, "maxResults": 100, "major": 5, "minor": 26, "startTime": inicioDia, "endTime": finDia, "timeReverseOrder": true }
        };

        const eventsUserCapture = await apiService.post(API_URL_DEVICE_EVENTS, API_USERNAME, API_PASSWORD, jsondata, "application/json");

        if (eventsUserCapture?.AcsEvent?.InfoList) {
            const events = eventsUserCapture.AcsEvent.InfoList;
            let processedCount = 0;

            for (const event of events) {
                if (event.employeeNoString && event.serialNo) {
                    try {
                        
                        // --- 1. BUSCAR SUSCRIPCIÓN (NUEVO) ---
                        // Buscamos la suscripción del usuario ANTES de procesar el evento
                        let suscripcionDelUsuario = null;
                        try {
                            const userQuery = await client.query(
                                'SELECT suscripcion FROM users WHERE employee_no = $1',
                                [event.employeeNoString]
                            );
                            if (userQuery.rows.length > 0) {
                                suscripcionDelUsuario = userQuery.rows[0].suscripcion;
                            }
                        } catch (dbError) {
                            console.error(`Error buscando suscripción para ${event.employeeNoString}:`, dbError.message);
                        }
                        // --- FIN BÚSQUEDA ---

                        console.log(`Procesando evento para: ${event.employeeNoString} (Suscripción: ${suscripcionDelUsuario})`);
                        
                        // 2. PRIMERO, intenta descontar como si fuera un usuario de tiquetera
                        // --- MODIFICADO: Pasamos la suscripción a la función
                        const ticketResult = await decrementTicketAccess(event.employeeNoString, suscripcionDelUsuario);

                        if (ticketResult) {
                            // Si tuvo éxito, el trabajo está hecho para este evento.
                            processedCount++;
                        } else {
                            // 3. SI NO ES UN USUARIO DE TIQUETERA VÁLIDO, ejecuta la lógica antigua.
                            console.log(`No se procesó como tiquetera, intentando como usuario normal...`);
                            
                            // --- MODIFICADO: Pasamos la suscripción al objeto del evento
                            const eventInserted = await insertEvent({
                                employee_no: event.employeeNoString, 
                                nombre: event.name, 
                                card_no: event.cardNo || null,
                                timestamp: event.time, 
                                door_no: event.doorNo, 
                                serial_no: event.serialNo,
                                user_type: event.userType || null, 
                                verify_mode: event.currentVerifyMode || null,
                                suscripcion: suscripcionDelUsuario // <-- ¡AQUÍ ESTÁ!
                            });

                            if (eventInserted) {
                                // (Esta lógica de descuento de accesos sigue igual)
                                const accesosDisponibles = await getUserAccessCount(event.employeeNoString);
                                const accesosDiarios = await getUserDailyAccessCount(event.employeeNoString);
                                if (accesosDiarios > 0) {
                                    if (accesosDisponibles > 0) {
                                        await decrementUserAccess(event.employeeNoString);
                                        await decrementUserDailyAccess(event.employeeNoString);
                                    } else {
                                        await decrementUserDailyAccess(event.employeeNoString);
                                    }
                                }
                                processedCount++;
                            }
                        }
                    } catch (error) {
                        console.error(`Error al procesar el evento para ${event.employeeNoString}:`, error.message);
                    }
                }
            }
            const message = `Sincronización completa. Se procesaron ${processedCount} eventos.`;
            console.log(message);
            if (res) return res.status(200).json({ message });

        } else {
            const message = 'No hay nuevos eventos para sincronizar.';
            console.log(message);
            if (res) return res.status(200).json({ message });
        }
    } catch (error) {
        console.error("Error fatal en la captura de eventos:", error.message);
        if (res) res.status(500).json({ message: 'Error general en la captura de eventos' });
    }
};

module.exports = {
    eventsCapture
    // La función getAllEventsCapture ya no es necesaria si solo usamos logs
};