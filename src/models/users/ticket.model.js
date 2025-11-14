// src/models/users/ticket.model.js

const { client } = require('../../db/databasepg'); // ¡Asegúrate de que esta ruta sea la correcta!

/**
 * Vende un tiquete. Crea o actualiza un registro en 'ticket_user'
 * y devuelve una bandera indicando la operación realizada.
 */
const sellTicket = async (ticketData) => {
    const { 
        employeeNo, name, gender, classesPurchased, 
        face_image, door_no, door_right, nota, groupID 
    } = ticketData;
    
    const purchaseDate = new Date();
    const expirationDate = new Date(purchaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + 2);

    try {
        await client.query('BEGIN');

        const existingTicketResult = await client.query('SELECT * FROM ticket_user WHERE employee_no = $1', [employeeNo]);
        let ticket;
        let operation; // <-- Nueva bandera para informar al controlador

        if (existingTicketResult.rows.length > 0) {
            // --- USUARIO DE TIQUETE EXISTE: ACTUALIZAR ---
            operation = 'updated'; // <-- Se informa que fue una actualización
            const currentTicket = existingTicketResult.rows[0];
            const newTotalAccesses = (currentTicket.accesos_disponibles || 0) + classesPurchased;
            
            const updateQuery = `
                UPDATE ticket_user 
                SET 
                    name = $1, gender = $2, classes_purchased = $3, accesos_disponibles = $4, 
                    purchase_date = $5, expiration_date = $6, activation = true, 
                    face_image = COALESCE($7, face_image), 
                    door_no = $8, 
                    door_right = $9, 
                    nota = $10, 
                    group_id = $11
                WHERE employee_no = $12 
                RETURNING *;
            `;
            const updatedResult = await client.query(updateQuery, [
                name, gender, classesPurchased, newTotalAccesses, purchaseDate, expirationDate, 
                face_image, door_no || 1, door_right || '1', nota, groupID, employeeNo
            ]);
            ticket = updatedResult.rows[0];
        } else {
            // --- USUARIO DE TIQUETE NO EXISTE: CREAR ---
            operation = 'created'; // <-- Se informa que fue una creación
            const createQuery = `
                INSERT INTO ticket_user (
                    employee_no, name, gender, face_image, classes_purchased, 
                    accesos_disponibles, purchase_date, expiration_date, activation, 
                    door_no, door_right, nota, group_id
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, $12
                ) RETURNING *;
            `;
            const newResult = await client.query(createQuery, [
                employeeNo, name, gender, face_image, classesPurchased, classesPurchased,
                purchaseDate, expirationDate, door_no || 1, door_right || '1', nota, groupID
            ]);
            ticket = newResult.rows[0];
        }
        
        await client.query('COMMIT');
        // Devolvemos el registro del tiquete Y la operación realizada
        return { ticket, operation }; 

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en la transacción de venta de tiquete:", error);
        throw error;
    }
};

/**
 * Obtiene todos los usuarios de la tabla ticket_user con paginación.
 */
// --- MODIFICACIÓN CLAVE AQUÍ ---
const getAllTicketUsers = async (page = 1, pageSize = 10, search = '') => {
    const offset = (page - 1) * pageSize;

    let baseQuery = 'FROM ticket_user';
    let whereClause = '';
    const values = []; // Para la consulta principal
    const totalValues = []; // Para la consulta de conteo

    // Si hay un término de búsqueda, lo añadimos
    if (search) {
        // $1 será el término de búsqueda
        // Usamos ILIKE para búsqueda no sensible a mayúsculas
        // Casteamos employee_no a TEXT para poder usar ILIKE
        whereClause = 'WHERE (name ILIKE $1 OR CAST(employee_no AS TEXT) ILIKE $1)';
        const searchTerm = `%${search}%`;
        values.push(searchTerm);
        totalValues.push(searchTerm);
    }

    // Construimos la consulta principal
    // Los índices de $ continúan desde 'values'
    const resultQuery = `
        SELECT * ${baseQuery}
        ${whereClause}
        ORDER BY name
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    // Añadimos los valores de paginación
    values.push(pageSize, offset);

    // Construimos la consulta de conteo total
    const totalQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;

    try {
        // Ejecutamos ambas consultas
        const result = await client.query(resultQuery, values);
        const totalResult = await client.query(totalQuery, totalValues);
        
        const totalUsers = totalResult.rows[0].count;

        return {
            totalUsers: totalUsers,
            users: result.rows,
        };
    } catch (error) {
        console.error('Error al obtener los usuarios de tiquetera:', error);
        throw new Error('Error al obtener los usuarios de tiquetera');
    }
};
// --- FIN DE LA MODIFICACIÓN ---

/**
 * Elimina un usuario de la tabla ticket_user por su employeeNo.
 */
const deleteTicketUser = async (employeeNo) => {
    try {
        const result = await client.query('DELETE FROM ticket_user WHERE employee_no = $1 RETURNING *', [employeeNo]);
        if (result.rowCount === 0) {
            // Es importante lanzar un error si no se encuentra para que el controlador lo sepa.
            throw new Error('No se encontró el usuario de tiquetera para eliminar.');
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error en el modelo al eliminar el usuario de tiquetera:', error);
        throw error;
    }
};
/**
 * Obtiene un usuario de tiquetera por su cédula.
 */
const getTicketUserByEmployeeNo = async (employeeNo) => {
    try {
        const result = await client.query('SELECT * FROM ticket_user WHERE employee_no = $1', [employeeNo]);
        if (result.rows.length === 0) {
            throw new Error('Usuario de tiquetera no encontrado.');
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Actualiza los datos de un usuario en la tabla ticket_user.
 */
const updateTicketUser = async (employeeNo, dataToUpdate) => {
    const { name, accesos_disponibles, expiration_date, activation, nota } = dataToUpdate;
    try {
        // Usamos COALESCE para actualizar solo los campos que vienen en dataToUpdate
        const query = `
            UPDATE ticket_user
            SET
                name = COALESCE($1, name),
                accesos_disponibles = COALESCE($2, accesos_disponibles),
                expiration_date = COALESCE($3, expiration_date),
                activation = COALESCE($4, activation),
                nota = COALESCE($5, nota)
            WHERE employee_no = $6
            RETURNING *;
        `;
        const values = [name, accesos_disponibles, expiration_date, activation, nota, employeeNo];
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('No se pudo actualizar el usuario de tiquetera.');
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};



/**
 * NUEVA FUNCIÓN: Actualiza únicamente la imagen facial de un usuario en la tabla 'ticket_user'.
 */
const updateTicketUserFace = async (employeeNo, faceImage) => {
    try {
        const query = `
            UPDATE ticket_user
            SET face_image = $1
            WHERE employee_no = $2
            RETURNING *;
        `;
        const result = await client.query(query, [faceImage, employeeNo]);
        if (result.rows.length === 0) {
            throw new Error('No se encontró el usuario de tiquetera para actualizar la imagen.');
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error en el modelo al actualizar la imagen del tiquete:', error);
        throw error;
    }
};


// Obtener todos los eventos desde la tabla ticket_accesos
const getAllTicketEvents = async () => {
    try {
        if (!client) {
            console.error('Error: Cliente de base de datos no disponible');
            return [];
        }

        const query = `
            SELECT *
            FROM ticket_accesos
            ORDER BY timestamp DESC;
        `;

        const result = await client.query(query);
        return result.rows;

    } catch (error) {
        console.error('Error consultando ticket_accesos:', error);
        return [];
    }
};




// --- EXPORTACIÓN FINAL Y COMPLETA ---
module.exports = {
    sellTicket,
    getAllTicketUsers,
    deleteTicketUser,
    getTicketUserByEmployeeNo, // <-- Ahora se exporta
    updateTicketUser,          // <-- Ahora se exporta
    updateTicketUserFace, // <-- Exportamos la nueva función
    getAllTicketEvents
};