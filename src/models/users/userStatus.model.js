const { client } = require("../../db/databasepg");

/**
 * Actualiza el estado de un usuario (activo/inactivo) basado en el número de empleado.
 */
const updateUserStatus = async (employeeNo, status) => {
    const query = `
      UPDATE users
      SET active = $1
      WHERE employee_no = $2
      RETURNING *;
    `;
    const values = [status, employeeNo];

    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error al actualizar el estado del usuario');
    }
};

module.exports = {
    updateUserStatus
};
