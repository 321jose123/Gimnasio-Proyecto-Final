const { API_URL_DEVICE_EVENTS } = require('../../../config');
const { apiService } = require('../../services/apiServices');
const { insertEvent, getAllEvents } = require('../../models/events/events.models');
const { insertTicketEvent } = require('../../models/events/ticketEvents.model');
const {
    getUserAccessCount,
    decrementUserAccess,
    getUserDailyAccessCount,
    decrementUserDailyAccess,
    searchUserByEmployeeNo
} = require('../../models/users/user.model');
const { decrementTicketAccess } = require('../../models/users/access.model');
const { API_USERNAME, API_PASSWORD } = process.env;
const { DateTime } = require("luxon");
const { client } = require('../../db/databasepg');
const { logDailyUserAccess } = require('../informes/informe.controller'); // Quitado 'checkEntryCooldown'

const searchID = `consulta_eventos_nuevos`;

// Variable para recordar el último evento procesado
let lastProcessedTimestamp = null; 

// CONFIGURACIÓN DE ZONA HORARIA
// ¡Importante! La zona horaria de tu servidor es 'America/Bogota' (-05:00)
// ¡Importante! La zona horaria de tu dispositivo es '+08:00' (según tus logs)
const ZONA_HORARIA_DISPOSITIVO = 'Asia/Shanghai'; // O 'Etc/GMT-8' que es +08:00
const ZONA_HORARIA_SERVIDOR = 'America/Bogota';


// ============================================================================
// CAPTURA DE EVENTOS (Solución Definitiva)
// ============================================================================
const eventsCapture = async (req, res) => {
    try {
        const ahoraEnServidor = DateTime.now().setZone(ZONA_HORARIA_SERVIDOR);
        let inicioPeticion;
        
        // finPeticion siempre será la hora actual en la zona del DISPOSITIVO
        const finPeticion = ahoraEnServidor.setZone(ZONA_HORARIA_DISPOSITIVO);

        if (lastProcessedTimestamp === null) {
            // *** ESTA ES LA SOLUCIÓN A TU PROBLEMA ***
            // Al reiniciar, no buscamos desde la medianoche.
            // Buscamos desde 10 segundos ANTES de la hora actual (en zona horaria del dispositivo).
            // Esto evita procesar eventos viejos, pero da un margen por si un evento
            // ocurre justo cuando el scheduler está corriendo.
            inicioPeticion = finPeticion.minus({ seconds: 15 });
            lastProcessedTimestamp = inicioPeticion.toISO(); // Guardamos este inicio
            console.log(`[SYNC] Primera ejecución/reinicio. Buscando eventos DESDE: ${inicioPeticion.toISO()}`);
        } else {
            // Siguientes veces: busca desde 1 segundo DESPUÉS del último evento
            // 'lastProcessedTimestamp' ya está en formato ISO con +08:00
            inicioPeticion = DateTime.fromISO(lastProcessedTimestamp).plus({ seconds: 1 });
        }

        if (inicioPeticion >= finPeticion) {
            console.log("[SYNC] Rango de tiempo inválido. Saltando ciclo.");
            if (res) return res.status(200).json({ status: 'success', message: 'No hay nuevos eventos (rango inválido).' });
            return;
        }

        // Formatear para la API (usamos las horas calculadas)
        const hora_inicio_api = inicioPeticion.toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
        const hora_final_api = finPeticion.toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

        const jsondata = {
            "AcsEventCond": {
                "searchID": searchID,
                "searchResultPosition": 0,
                "maxResults": 100,
                "major": 0, 
                "minor": 0,
                "startTime": hora_inicio_api,
                "endTime": hora_final_api,
                "timeReverseOrder": true 
            }
        };

        let eventsUserCapture;
        try {
            // console.log(`[SYNC] Pidiendo eventos de ${hora_inicio_api} a ${hora_final_api}`); // Log opcional
            eventsUserCapture = await apiService.post(
                API_URL_DEVICE_EVENTS,
                API_USERNAME,
                API_PASSWORD,
                jsondata,
                "application/json"
            );
        } catch (error) {
             console.error("❌ Error al capturar eventos del dispositivo:", error);
            if(res){ return res.status(500).json({ /* ... tu error ... */ }); }
            return; 
        }

        if (eventsUserCapture?.AcsEvent?.InfoList && eventsUserCapture.AcsEvent.InfoList.length > 0) {

            const listaEventos = eventsUserCapture.AcsEvent.InfoList;
            let eventosProcesados = 0;
            // Guardamos el MÁS RECIENTE (el primero de la lista)
            let ultimoTimestampDeEsteLote = listaEventos[0].time; 

            for (const evento of listaEventos) {

               // --- ¡LA MODIFICACIÓN ESTÁ AQUÍ! ---
                // AHORA ACEPTAMOS 5/38 (Éxito) Y 5/75 (Fallo)
                const isAccessEvent = evento.major === 5 && (evento.minor === 38 || evento.minor === 75);

                if (!isAccessEvent) {
                    // Ignoramos cualquier otra cosa
                    continue;
                }
                
                if (evento.major === 5 && evento.minor === 75) {
                    console.log(`[SYNC] Evento 5/75 (Fallo) detectado. Se procesará como acceso válido.`);
                }
                // --- FIN DE LA MODIFICACIÓN ---

                const employeeNo = evento.employeeNoString;
                if (!employeeNo) { 
                    console.warn(`[SYNC] Evento 5/38 o 5/75 ignorado (sin employeeNo). S/N: ${evento.serialNo}`);
                    continue; 
                }

                // LÓGICA CORREGIDA (Revisar ticket_user PRIMERO)
                const ticketUserCheck = await client.query('SELECT 1 FROM ticket_user WHERE employee_no = $1 AND activation = true', [employeeNo]);
                const userCheck = await client.query('SELECT 1 FROM users WHERE employee_no = $1', [employeeNo]);
                
                const eventData = {
                    employee_no: employeeNo,
                    nombre: evento.name,
                    card_no: evento.cardNo || null,
                    timestamp: evento.time,
                    door_no: evento.doorNo,
                    serial_no: evento.serialNo,
                    user_type: evento.userType || null,
                    verify_mode: evento.currentVerifyMode || null,
                    mask_status: evento.mask || null,
                    picture_url: evento.pictureURL || null
                };

                // 🔹 Si es usuario de tiquetera
                if (ticketUserCheck.rowCount > 0) {
                    try {
                        // ATENCIÓN: Esta lógica asume que 'decrementTicketAccess' previene duplicados
                        const ticketResult = await decrementTicketAccess(employeeNo, {
                             door_no: evento.doorNo,
                             serial_no: evento.serialNo,
                             name: evento.name
                        });
                        // Solo insertamos en 'ticket_accesos' SI el descuento fue exitoso (no duplicado)
                        if (ticketResult) { 
                            await insertTicketEvent(eventData);
                            eventosProcesados++; 
                        }
                    } catch (e) { 
                         // El error 23505 (duplicado) debería ser manejado por decrementTicketAccess
                         if (e.code !== '23505') { console.error(`Error procesando 'ticket_user' ${employeeNo}:`, e.message); } 
                    }
                }
                // 🔹 Si es usuario normal (pero no tiquetera)
                else if (userCheck.rowCount > 0) {
                    try {

                        const user = await searchUserByEmployeeNo(employeeNo);
                        eventData.suscripcion = user.suscripcion; 
                        
                        // 1. Guarda en 'eventos_accesos'
                        await insertEvent(eventData);
                        
                        // 2. Guarda en 'informes' (si es 'diaria')
                        await logDailyUserAccess(employeeNo, eventData.timestamp);
                        //------------------------------------
                        console.log(`✅ Usuario ${employeeNo} acceso procesado.`);
                        eventosProcesados++;
                    } catch (e) { 
                        if (e.code !== '23505') { console.error(`Error procesando 'user' ${employeeNo}:`, e.message); } 
                    }
                }
                // 🔹 No existe en ninguna tabla
                else {
                    console.warn(`❌ Usuario ${employeeNo} (evento 5/38) no existe en BD. S/N: ${evento.serialNo}`);
                }
            } // --- Fin del bucle FOR ---

            if (ultimoTimestampDeEsteLote) {
                 lastProcessedTimestamp = ultimoTimestampDeEsteLote;
                 console.log(`[SYNC] Timestamp actualizado a: ${lastProcessedTimestamp}`);
            }

            if (eventosProcesados > 0) {
                console.log(`[SYNC] Fin ciclo. ${eventosProcesados} accesos válidos procesados.`);
            }

            if(res){ /* ... tu respuesta JSON ... */ }

        } else {
            console.log("[SYNC] No hay eventos nuevos para sincronizar.");
            if(res){ /* ... tu respuesta JSON ... */ }
        }

    } catch (error) {
        console.error("❌ Error general en eventsCapture:", error);
       if(res){ /* ... tu manejo de error con res ... */ }
    }
};

// ============================================================================
// CONSULTAR TODOS LOS EVENTOS (No necesita cambios)
// ============================================================================
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
        console.error("❌ Error obteniendo eventos:", error);
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