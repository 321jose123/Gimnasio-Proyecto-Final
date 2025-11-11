// Importa el modelo de informes
const InformeModel = require('../../models/informes/informe.model'); // Ajusta esta ruta

// Importa el modelo de usuarios para buscar la suscripción
const UserModel = require('../../models/users/users.models'); // Ajusta esta ruta

const EventModel = require('../../models/events/events.models'); // Ajusta la ruta

const COOLDOWN_MINUTES = 5; // 5 minutos de espera

/**
 * Registra una entrada en 'informes' cuando se crea un nuevo usuario.
 * (Esta función ya está correcta)
 */
const logNewUserRegistration = async (userData) => {
    try {
        let informeData;

        // userData es un 'user' (viene de user.model)
        if (userData.acc_diarios !== undefined) { 
            informeData = {
                employeeNo: userData.employee_no,
                name: userData.name,
                user_type: userData.user_type,
                suscripcion: userData.suscripcion, 
                registration_date: new Date(),
                clase: 0 
            };
        } 
        // userData es un 'ticket_user' (viene de ticket.model)
        else if (userData.classes_purchased !== undefined) { 
            informeData = {
                employeeNo: userData.employee_no,
                name: userData.name,
                user_type: 'tiquetera',
                suscripcion: 'tiquetera',
                registration_date: new Date(),
                clase: userData.classes_purchased
            };
        } 
        // Fallback
        else {
             console.warn('Intento de registrar informe con objeto desconocido o indefinido:', userData);
             return;
        }

        if (!informeData.employeeNo) {
            console.warn('Intento de registrar informe sin employee_no. Objeto recibido:', userData);
            return;
        }

        console.log(`Registrando nuevo usuario en informes: ${informeData.employeeNo}`);
        await InformeModel.createInformeEntry(informeData);

    } catch (error) {
        console.error(`Error en logNewUserRegistration: ${error.message}`, error);
    }
};

/**
 * Registra un evento de acceso para usuarios con suscripción "Diaria".
 * (ESTA ES LA FUNCIÓN CORREGIDA)
 */
const logDailyUserAccess = async (employeeNo, accessTime) => {
    try {
        const user = await UserModel.searchUserByEmployeeNo(employeeNo);

        // --- CORRECIÓN DE LÓGICA ---
        // Comparamos en minúsculas para evitar errores (ej: 'Diaria' vs 'diaria')
        // Y nos aseguramos que user.suscripcion exista antes de llamar .toLowerCase()
        if (!user || !user.suscripcion || user.suscripcion.toLowerCase() !== 'diaria') {
            return;
        }
        // --- FIN CORRECCIÓN ---

        console.log(`Registrando acceso de usuario 'Diaria' en informes: ${employeeNo}`);
        
        const informeData = {
            employeeNo: user.employee_no,
            name: user.name,
            user_type: user.user_type,
            suscripcion: user.suscripcion,
            registration_date: accessTime,
            clase: 0 // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
                      // Los eventos de acceso no suman clases, así que enviamos 0.
        };
        
        await InformeModel.createInformeEntry(informeData);

    } catch (error) {
        // Si hay un error (ej: el modelo falla), lo veremos en el log en lugar de fallar silenciosamente
        console.error(`Error en logDailyUserAccess para ${employeeNo}:`, error.message);
    }
};

/**
 * Obtiene todos los registros de la tabla 'informes' con paginación.
 * (Esta función ya está correcta)
 */
const getInformes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        
        const { suscripcion } = req.query;

        const data = await InformeModel.getAllInformes(page, pageSize, suscripcion);

        res.status(200).json({
            success: true,
            message: 'Informes obtenidos exitosamente.',
            data: data
        });
    } catch (error) {
        console.error('Error en el controlador getInformes:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los informes.',
            error: error.message
        });
    }
};

/**
 * ¡FUNCIÓN ACTUALIZADA! Verifica si un usuario puede ingresar.
 * Revisa la suscripción y el tiempo de espera de 5 minutos
 * AHORA USA LA TABLA 'eventos_accesos'
 */
const checkEntryCooldown = async (employeeNo) => {
    try {
        // 1. Verificar la suscripción del usuario
        const user = await UserModel.searchUserByEmployeeNo(employeeNo);
        if (!user) {
            return { allowed: false, message: 'Usuario no encontrado.' };
        }

        const suscripcion = user.suscripcion ? user.suscripcion.toLowerCase() : '';

        // 2. Revisar si la suscripción tiene acceso ilimitado (diaria, tiquetera)
        if (suscripcion === 'diaria' || suscripcion === 'tiquetera') {
            return { allowed: true }; // Se permite el ingreso, no hay cooldown
        }

        // 3. Revisar si la suscripción SÍ tiene cooldown (mensual, semanal)
        if (suscripcion === 'mensual' || suscripcion === 'semanal') {
            
            // 4. --- ¡LÓGICA ACTUALIZADA! ---
            // Buscar el último ingreso en 'eventos_accesos' (el log físico)
            const lastEntry = await EventModel.getLatestAccessEvent(employeeNo);

            // Si nunca ha entrado, se le permite
            if (!lastEntry) {
                return { allowed: true };
            }

            // 5. Calcular la diferencia de tiempo
            const lastEntryTime = new Date(lastEntry.timestamp);
            const currentTime = new Date();
            const diffMs = currentTime.getTime() - lastEntryTime.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < COOLDOWN_MINUTES) {
                // Si aún no pasan 5 minutos, se bloquea
                const waitTime = COOLDOWN_MINUTES - diffMins;
                return { 
                    allowed: false, 
                    message: `Debe esperar ${waitTime} minuto(s) más para volver a ingresar.` 
                };
            } else {
                // Si ya pasaron 5 minutos, se permite
                return { allowed: true };
            }
        }

        // Si la suscripción no es ninguna de las anteriores, denegar por defecto
        return { allowed: false, message: 'Suscripción no válida para el ingreso.' };

    } catch (error) {
        console.error(`Error en checkEntryCooldown para ${employeeNo}:`, error.message);
        return { allowed: false, message: 'Error interno al verificar el ingreso.' };
    }
};


module.exports = {
    logNewUserRegistration,
    logDailyUserAccess,
    getInformes,
    checkEntryCooldown // <-- Esta función ahora está actualizada
};