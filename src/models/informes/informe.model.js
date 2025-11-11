const { client } = require("../../db/databasepg"); // Asegúrate que esta ruta sea correcta

/**
 * Crea una nueva entrada en la tabla 'informes'.
 * @param {Object} informeData - Datos para el informe.
 * @param {string} informeData.employeeNo - El ID del empleado.
 * @param {string} informeData.name - El nombre.
 * @param {string} informeData.user_type - El tipo de usuario.
 * @param {string} informeData.suscripcion - El tipo de suscripción.
 * @param {Date|string} informeData.registration_date - La fecha del evento (creación o acceso).
 */
const createInformeEntry = async (informeData) => {
    
    // --- ¡CORRECCIÓN AQUÍ! ---
    // 1. Añade 'clase' a la desestructuración
    const { employeeNo, name, user_type, suscripcion, registration_date, clase } = informeData;
    
    // Si registration_date se proporciona, úsala. Si no, usa la hora actual.
    const regDate = registration_date ? new Date(registration_date) : new Date();

    // 2. Añade 'clase' a la consulta SQL
    const query = `
        INSERT INTO informes (employee_no, name, user_type, suscripcion, registration_date, clase)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    
    // --- ¡CORRECCIÓN AQUÍ! ---
    // 3. Ahora 'clase' está definida y se puede usar. (clase || 0) se asegura de que si es undefined, guarde 0.
    const values = [employeeNo, name, user_type, suscripcion, regDate, clase || 0];
    
    try {
        const result = await client.query(query, values);
        console.log(`[InformeModel] Entrada registrada para ${result.rows[0].employee_no} en 'informes' (Clases: ${result.rows[0].clase}).`);
        return result.rows[0];
    } catch (error) {
        console.error('Error al insertar en la tabla de informes:', error);
        throw error;
    }
};

/**
 * Obtiene todos los registros de la tabla 'informes' con paginación y filtrado.
 */
// --- ¡CORRECCIÓN APLICADA AQUÍ! ---
const getAllInformes = async (page = 1, pageSize = 10, filtroSuscripcion) => {
    const offset = (page - 1) * pageSize;
    
    // Valores para la consulta principal (con paginación)
    let resultValues = [pageSize, offset]; 
    // Valores para la consulta de conteo (sin paginación)
    let totalValues = [];

    // Cláusulas WHERE separadas para cada consulta
    let whereClauseResult = "";
    let whereClauseTotal = "";

    if (filtroSuscripcion) {
        // Para la consulta principal, el filtro será el 3er parámetro ($3)
        whereClauseResult = `WHERE suscripcion = $3`;
        resultValues.push(filtroSuscripcion); 
        
        // Para la consulta de conteo, el filtro será el 1er parámetro ($1)
        whereClauseTotal = `WHERE suscripcion = $1`;
        totalValues.push(filtroSuscripcion);
    }
    // --- FIN DE LA CORRECCIÓN ---

    try {
        // Consulta para obtener los informes paginados y filtrados
        const resultQuery = `
            SELECT * FROM informes
            ${whereClauseResult} 
            ORDER BY registration_date DESC
            LIMIT $1 OFFSET $2;
        `;
        const result = await client.query(resultQuery, resultValues); // Usa resultValues

        // Consulta para obtener el conteo total de informes (también filtrado)
        const totalQuery = `SELECT COUNT(*) FROM informes ${whereClauseTotal};`;
        const totalResult = await client.query(totalQuery, totalValues); // Usa totalValues
        
        const totalInformes = totalResult.rows[0].count;

        return {
            totalInformes: totalInformes,
            informes: result.rows,
        };
    } catch (error) {
        console.error('Error al obtener los informes (model):', error.message);
        throw new Error('Error al obtener los informes');
    }
};

module.exports = { 
    createInformeEntry,
    getAllInformes
};