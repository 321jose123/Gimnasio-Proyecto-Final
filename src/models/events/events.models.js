const { client } = require('../../db/databasepg');

const insertEvent = async (event) => {
    try {
        // Verificar que el cliente esté disponible
        if (!client) {
            console.error('Error: Cliente de base de datos no disponible');
            return false;
        }

        const query = `
            INSERT INTO eventos_accesos (employee_no, nombre, card_no, timestamp, door_no, serial_no, user_type, verify_mode, mask_status, picture_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (serial_no) DO NOTHING
            RETURNING serial_no;
        `;

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
            event.picture_url
        ];

        const result = await client.query(query, values);
        return result.rowCount > 0;

    } catch (error) {
        console.error('Error insertando evento:', error);
        console.error('Cliente disponible:', !!client);
        return false;
    }
};

const getAllEvents = async () => {
    try {
        // Verificar que el cliente esté disponible
        if (!client) {
            console.error('Error: Cliente de base de datos no disponible');
            return [];
        }

        const query = `
            SELECT * FROM eventos_accesos
            ORDER BY timestamp DESC;
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

