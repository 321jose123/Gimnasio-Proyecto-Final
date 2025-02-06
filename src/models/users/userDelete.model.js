const { client } = require("../../db/databasepg");

/**
 * Elimina un usuario y sus imágenes asociadas de la base de datos usando su número de empleado.
 */
const deleteUserByEmployeeNo = async (employeeNo) => {
    try {
        const deleteImagesQuery = `
            DELETE FROM user_images
            WHERE employee_no = $1;
        `;
        await client.query(deleteImagesQuery, [employeeNo]);

        const deleteUserQuery = `
            DELETE FROM users
            WHERE employee_no = $1
            RETURNING *;
        `;
        const result = await client.query(deleteUserQuery, [employeeNo]);

        if (result.rowCount === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        throw new Error('Error al eliminar el usuario');
    }
};

module.exports = {
    deleteUserByEmployeeNo
};
