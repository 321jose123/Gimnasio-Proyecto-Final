const { client } = require("../../db/databasepg");

const updateUserAccesses = async (employeeNo, accesses) => {
    const query = `
      UPDATE users
      SET accesos_disponibles = $1
      WHERE employee_no = $2
      RETURNING *;
    `;
    const values = [accesses, employeeNo];

    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error("Error al actualizar los accesos del usuario:", error.message);
        throw new Error('Error al actualizar los accesos del usuario');
    }
}

module.exports = { 
    updateUserAccesses 
};