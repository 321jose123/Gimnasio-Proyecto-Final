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
        
        if (result.rows.length > 0) {
            const updatedUser = result.rows[0];
            console.log(`✔️ Usuario ${employeeNo} ahora tiene ${accesses} accesos disponibles.`);
            
            // Si no tiene accesos y está activo, debería desactivarse
            if (accesses === 0 && updatedUser.active) {
                console.log(`⚠️ Usuario ${employeeNo} se ha quedado sin accesos disponibles. Debería ser desactivado.`);
            }
            
            return updatedUser;
        } else {
            throw new Error(`No se encontró el usuario ${employeeNo} para actualizar.`);
        }
    } catch (error) {
        console.error("Error al actualizar los accesos del usuario:", error.message);
        throw new Error('Error al actualizar los accesos del usuario: ' + error.message);
    }
}

module.exports = { 
    updateUserAccesses 
};