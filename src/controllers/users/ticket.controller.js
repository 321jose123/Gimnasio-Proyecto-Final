const TicketModel = require('../../models/users/ticket.model');
const { apiService } = require('../../services/apiServices');
const { logNewUserRegistration } = require('../informes/informe.controller'); // Ajusta esta ruta si es necesario
const {
    API_URL_UPDATE_USER, 
    API_URL_SEARCH_USER,
    API_URL_ADD_USER, 
    API_URL_DELETE_USER, // <-- Importante
    API_USERNAME, 
    API_PASSWORD } = require('../../../config');

// --- FUNCIÓN AUXILIAR PARA FORMATEAR LA FECHA AL FORMATO REQUERIDO POR HIKVISION ---
const formatDateForDevice = (date) => {
    if (!date) return '';
    // new Date() es necesario si la fecha viene como string desde la BD
    // .slice(0, 19) elimina los milisegundos y la 'Z' (ej: '2025-10-10T17:16:31')
    return new Date(date).toISOString().slice(0, 19);
};

const sellTicket = async (req, res) => {
    try {
        // Paso 1: Guardar/Actualizar en nuestra base de datos
        // Esta parte es importante para tener los datos del tiquete listos.
        const { ticket } = await TicketModel.sellTicket(req.body);

        // --- AÑADIDO: LLAMA AL INFORME AQUÍ ---
        // Llama a la función de informes justo después de crear el tiquete en la BD
        logNewUserRegistration(ticket); 
        // --- FIN DE LA LÍNEA AÑADIDA ---

        // --- Paso 2: Lógica Inteligente de Sincronización con el Dispositivo ---
        let userExistsOnDevice = false;
        
        // Primero, intentamos buscar al usuario en el dispositivo
        try {
            console.log(`Buscando usuario ${ticket.employee_no} en el dispositivo...`);
            const searchPayload = { UserInfoSearchCond: { searchID: "1", searchResultPosition: 0, maxResults: 1, EmployeeNoList: [{ employeeNo: ticket.employee_no }] } };
            const searchResponse = await apiService.post(API_URL_SEARCH_USER, API_USERNAME, API_PASSWORD, searchPayload, 'application/json');
            
            // --- ¡CORREGIDO! SE ELIMINARON LAS LÍNEAS DUPLICADAS DE AQUÍ ---

            // Si la búsqueda es exitosa y encuentra al menos una coincidencia, el usuario existe.
            if (searchResponse.UserInfoSearch.responseStatusStrg === 'OK' && searchResponse.UserInfoSearch.numOfMatches > 0) {
                userExistsOnDevice = true;
                console.log(`Usuario ${ticket.employee_no} ENCONTRADO en el dispositivo.`);
            } else {
                console.log(`Usuario ${ticket.employee_no} NO encontrado en el dispositivo.`);
            }
        } catch (error) {
            // Si la búsqueda da un error que no sea 'OK', asumimos que el usuario no existe.
            console.log(`Búsqueda en dispositivo falló. Asumiendo que el usuario ${ticket.employee_no} no existe.`);
            userExistsOnDevice = false;
        }
        
        // --- Paso 3: Construir el payload y actuar en consecuencia ---
        const devicePayload = {
            // ... (el resto de tu función está perfecto) ...
            userInfo: { 
                employeeNo: ticket.employee_no,
                name: ticket.name,
                userType: "normal",
                Valid: { 
                    enable: true, 
                    beginTime: formatDateForDevice(ticket.purchase_date), 
                    endTime: formatDateForDevice(ticket.expiration_date) 
                },
                doorRight: ticket.door_right || "1",
                RightPlan: [{ doorNo: ticket.door_no || 1, planTemplateNo: "1" }],
                userVerifyMode: "faceOrFpOrCardOrPw",
                localUIUserType: 'normal',
                checkUser: true,
                terminalNoList: [ 1 ],
                addUser: true 
            }
        };

        let deviceResponse;
        if (userExistsOnDevice) {
            // Si el usuario SÍ existe en el dispositivo, lo ACTUALIZAMOS
            console.log(`Sincronizando (UPDATE) usuario existente ${ticket.employee_no} con el dispositivo...`);
            deviceResponse = await apiService.put(API_URL_UPDATE_USER, API_USERNAME, API_PASSWORD, devicePayload, 'application/json');
        } else {
            // Si el usuario NO existe en el dispositivo, lo CREAMOS
            console.log(`Sincronizando (ADD) nuevo usuario ${ticket.employee_no} con el dispositivo...`);
            deviceResponse = await apiService.post(API_URL_ADD_USER, API_USERNAME, API_PASSWORD, devicePayload, 'application/json');
        }

        res.status(201).json({
            message: `Tiquete vendido y usuario sincronizado correctamente.`,
            data: { ticket, device: deviceResponse }
        });

    } catch (error) {
        console.error("Error en el controlador al vender el tiquete:", error.message);
        if (error.response?.data) { console.error("Respuesta del dispositivo:", error.response.data); }
        res.status(500).json({ message: 'Error interno del servidor al procesar la venta.', error: error.message });
    }
};

/**
 * Lista todos los usuarios de la tabla ticket_user.
 */
const listAllTicketUsers = async (req, res) => {
    const { page = 1, pageSize = 100 } = req.query;
    try {
        const data = await TicketModel.getAllTicketUsers(page, pageSize);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al listar usuarios de tiquetera.', error: error.message });
    }
};

/**
 * Elimina un usuario de la tabla ticket_user.
 */
// --- FUNCIÓN DE ELIMINACIÓN ACTUALIZADA ---
const deleteTicketUser = async (req, res) => {
    const { employeeNo } = req.body;
    if (!employeeNo) {
        return res.status(400).json({ message: 'El employeeNo es obligatorio.' });
    }

    try {
        // --- Paso 1: Eliminar del Dispositivo Físico ---
        console.log(`Intentando eliminar al usuario ${employeeNo} del dispositivo...`);
        const devicePayload = {
            UserInfoDelCond: {
                EmployeeNoList: [{ "employeeNo": employeeNo }]
            }
        };

        // Usamos el endpoint y método correcto según tu documentación (PUT /delete)
        await apiService.put(API_URL_DELETE_USER, API_USERNAME, API_PASSWORD, devicePayload, 'application/json');
        console.log(`Usuario ${employeeNo} eliminado del dispositivo con éxito.`);

        // --- Paso 2: Eliminar de la Base de Datos 'ticket_user' ---
        // Esto solo se ejecuta si la eliminación del dispositivo fue exitosa.
        console.log(`Eliminando al usuario ${employeeNo} de la tabla ticket_user...`);
        await TicketModel.deleteTicketUser(employeeNo);
        console.log(`Usuario ${employeeNo} eliminado de la base de datos con éxito.`);
        
        res.status(200).json({ success: true, message: 'Usuario de tiquetera eliminado de la base de datos y del dispositivo.' });

    } catch (error) {
        console.error('Error en el proceso de eliminación del usuario de tiquetera:', error.message);
        
        // Damos un mensaje de error más específico
        if (error.response) { // Si el error vino de la API del dispositivo
            return res.status(500).json({ success: false, message: 'Error al comunicarse con el dispositivo.', error: error.response.data || error.message });
        }
        
        res.status(500).json({ success: false, message: 'Error al eliminar el usuario de tiquetera en la base de datos.', error: error.message });
    }
};

/**
 * Obtiene los detalles de un solo usuario de tiquetera.
 */
const getTicketUser = async (req, res) => {
    try {
        const { employeeNo } = req.params;
        const ticketUser = await TicketModel.getTicketUserByEmployeeNo(employeeNo);
        res.status(200).json({ success: true, data: ticketUser });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

/**
 * Actualiza los detalles de un usuario de tiquetera.
 */
const updateTicketUser = async (req, res) => {
    try {
        const { employeeNo } = req.params;
        const updatedTicketUser = await TicketModel.updateTicketUser(employeeNo, req.body);
        res.status(200).json({ success: true, message: 'Usuario de tiquetera actualizado.', data: updatedTicketUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar usuario de tiquetera.', error: error.message });
    }
};


/**
 * NUEVA FUNCIÓN: Guarda la imagen facial de un usuario de tiquetera en la base de datos.
 */
const saveTicketUserFace = async (req, res) => {
    const { employeeNo, face_image } = req.body;
    if (!employeeNo || !face_image) {
        return res.status(400).json({ success: false, message: 'employeeNo y face_image son requeridos.' });
    }
    try {
        const updatedTicket = await TicketModel.updateTicketUserFace(employeeNo, face_image);
        res.status(200).json({
            success: true,
            message: 'Imagen del tiquete guardada correctamente.',
            data: updatedTicket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al guardar la imagen del tiquete.',
            error: error.message
        });
    }
};

// Endpoint: obtener todos los accesos de ticket_user
const getAllTicketAccessEvents = async (req, res) => {
    try {
        const eventos = await TicketModel.getAllTicketEvents(); // ✅ llamada al modelo
        res.status(200).json({
            status: "success",
            eventos
        });
    } catch (error) {
        console.error("Error obteniendo eventos de ticket_accesos:", error);
        res.status(500).json({
            status: "error",
            message: "Error al obtener los eventos de ticket_accesos"
        });
    }
};
// --- EXPORTACIÓN COMPLETA Y CORREGIDA ---
// Ahora se exportan todas las funciones necesarias para las rutas.
module.exports = { 
    sellTicket,
    listAllTicketUsers,
    deleteTicketUser,
    getTicketUser,
    updateTicketUser,
    saveTicketUserFace, // <-- Se exporta la nueva función
    getAllTicketAccessEvents

};