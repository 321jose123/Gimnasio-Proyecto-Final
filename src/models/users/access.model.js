const { client } = require('../../db/databasepg'); // ¡Asegúrate de que esta ruta sea la correcta!

/**
 * LÓGICA EXCLUSIVA PARA TIQUETERA: Descuenta un acceso de un 'ticket_user'.
 * Si los accesos llegan a 0, desactiva el tiquete y lo registra en 'access_ticket_logs'.
 * @param {string} employeeNo - Cédula del usuario.
 * @param {object} eventData - Datos del evento (door_no, serial_no, name).
 * @returns {object|null} Retorna el tiquete actualizado si tuvo éxito, o null si no.
 */
const decrementTicketAccess = async (employeeNo, eventData) => {
    const { door_no, serial_no, name } = eventData;
    try {
        await client.query('BEGIN'); // Iniciar transacción segura

        // 1. Busca un tiquete activo con accesos disponibles para esta cédula
        const ticketResult = await client.query(
            'SELECT * FROM ticket_user WHERE employee_no = $1 AND activation = true AND accesos_disponibles > 0 FOR UPDATE', 
            [employeeNo]
        );

        // Si no se encuentra un tiquete válido, no hay nada que hacer.
        if (ticketResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null; // Indica que no es un usuario de tiquetera válido para descontar
        }

        const userRecord = ticketResult.rows[0];
        const accesses_before = userRecord.accesos_disponibles;
        const accesses_after = accesses_before - 1;

        // 2. Descuenta un acceso en la tabla ticket_user
        const updatedResult = await client.query(
            'UPDATE ticket_user SET accesos_disponibles = $1 WHERE id = $2 RETURNING *;', 
            [accesses_after, userRecord.id]
        );
        const updatedTicket = updatedResult.rows[0];

        // 3. Si los accesos llegan a 0, desactiva el tiquete
        if (updatedTicket.accesos_disponibles <= 0) {
            await client.query('UPDATE ticket_user SET activation = false WHERE id = $1', [updatedTicket.id]);
            updatedTicket.activation = false;
            console.log(`- Tiquete de ${employeeNo} ha sido desactivado por falta de accesos.`);
        }

        // 4. Registra el ingreso en la tabla de logs de tiquetes
        // Asegúrate de haber creado la tabla 'access_ticket_logs'
        await client.query(
            'INSERT INTO access_ticket_logs (employee_no, name, ticket_id, door_no, accesses_before, accesses_after, serial_no) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [employeeNo, name, updatedTicket.id, door_no, accesses_before, accesses_after, serial_no]
        );
        
        await client.query('COMMIT');
        // Este es el log que estabas esperando ver
        console.log(`🔽 [TIQUETERA] Acceso descontado para ${employeeNo}. Le quedan ${accesses_after}.`);
        return updatedTicket;

    } catch (error) {
        await client.query('ROLLBACK');
        // Manejar el error de 'serial_no' duplicado para no detener la sincronización
        if (error.code === '23505' && error.constraint && error.constraint.includes('serial_no')) {
            console.warn(`[TIQUETERA] Evento con serial_no ${serial_no} ya fue procesado. Ignorando.`);
            return null;
        }
        console.error(`[TIQUETERA] Error crítico al descontar acceso para ${employeeNo}:`, error);
        throw error;
    }
};

module.exports = {
    decrementTicketAccess
};