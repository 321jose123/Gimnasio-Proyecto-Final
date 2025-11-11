const { client } = require('../../db/databasepg');

const insertEvent = async (event) => {
    try {
        // Verificar que el cliente esté disponible
        if (!client) {
            console.error('Error: Cliente de base de datos no disponible');
            return false;
        }

        // --- MODIFICADO ---
        // 1. Añadimos 'suscripcion' a la lista de columnas
        const query = `
            INSERT INTO eventos_accesos (
                employee_no, nombre, card_no, "timestamp", door_no, 
                serial_no, user_type, verify_mode, mask_status, picture_url, 
                suscripcion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) -- 2. Añadimos $11
            ON CONFLICT (serial_no) DO NOTHING
            RETURNING serial_no;
        `;
        // Nota: He puesto "timestamp" entre comillas porque es una palabra reservada
        // de SQL y tu CREATE TABLE anterior lo tenía así. 
        // Si tu tabla no lo tiene entre comillas, puedes quitarlas.
        // (Tu código original no las tenía, así que las quito para ser consistente contigo)

        const query_final = `
            INSERT INTO eventos_accesos (
                employee_no, nombre, card_no, timestamp, door_no, 
                serial_no, user_type, verify_mode, mask_status, picture_url, 
                suscripcion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (serial_no) DO NOTHING
            RETURNING serial_no;
        `;


        // 3. Añadimos event.suscripcion al array de valores
        const values = [
            event.employee_no,
            event.nombre,
            event.card_no,
            event.timestamp,
            event.door_no,
            event.serial_no,
            event.user_type,
            event.verify_mode,
            event.mask_status,
            event.picture_url,
            event.suscripcion // <-- VALOR NUEVO AÑADIDO
        ];
        // --- FIN DE LA MODIFICACIÓN ---

        const result = await client.query(query_final, values);
        return result.rowCount > 0;

    } catch (error) {
        console.error('Error insertando evento:', error);
        console.error('Cliente disponible:', !!client);
        return false;
    }
};

// (Esta función no necesita cambios, `e.*` incluirá la nueva columna)
const getAllEvents = async () => {
    try {
        if (!client) {
            console.error('Error: Cliente de base de datos no disponible');
            return [];
        }

        // 🔹 Traemos todos los eventos
        const query = `
            SELECT e.*, 
                CASE 
                    WHEN u.employee_no IS NOT NULL THEN 'users'
                    WHEN t.employee_no IS NOT NULL THEN 'ticket_user'
                    ELSE 'desconocido'
                END AS table_source
            FROM eventos_accesos e
            LEFT JOIN users u ON e.employee_no = u.employee_no
            LEFT JOIN ticket_user t ON e.employee_no = t.employee_no
            ORDER BY e.timestamp DESC;
        `;

        const result = await client.query(query);
        return result.rows;

    } catch (error) {
        console.error('Error consultando eventos:', error);
        console.error('Cliente disponible:', !!client);
        return [];
    }
};

module.exports = {
    insertEvent,
    getAllEvents
};