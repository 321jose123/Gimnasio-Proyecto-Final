const { client } = require('../../db/databasepg');

// Inserta un evento en la tabla ticket_accesos
const insertTicketEvent = async (eventData) => {
    try {
        await client.query(
            `INSERT INTO ticket_accesos (
                employee_no, nombre, card_no, timestamp, door_no, serial_no,
                user_type, verify_mode, mask_status, picture_url
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
                eventData.employee_no,
                eventData.nombre,
                eventData.card_no,
                eventData.timestamp,
                eventData.door_no,
                eventData.serial_no,
                eventData.user_type,
                eventData.verify_mode,
                eventData.mask_status,
                eventData.picture_url
            ]
        );
        console.log(`✅ Evento insertado en ticket_accesos para ${eventData.employee_no}`);
        return true;
    } catch (err) {
        console.error("❌ Error insertando evento en ticket_accesos:", err.message);
        return false;
    }
};

module.exports = { insertTicketEvent };
