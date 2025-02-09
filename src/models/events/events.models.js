const { client } = require('../../db/databasepg');

const insertEvent = async (event) => {
    try {
        const query = `
            INSERT INTO eventos_accesos (employee_no, nombre, card_no, timestamp, door_no, serial_no, user_type, verify_mode, mask_status, picture_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (serial_no) DO NOTHING;
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

        await client.query(query, values);
    } catch (error) {
        console.error('Error insertando evento:', error);
    }
};

module.exports = { insertEvent };
