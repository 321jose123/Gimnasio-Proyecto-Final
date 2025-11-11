const { client } = require("../../db/databasepg");

/**
 * Inserta o actualiza la imagen del usuario en la tabla user_images.
 */
const saveUserImage = async (employeeNo, img64) => {
    const query = `
      INSERT INTO user_images (employee_no, img64)
      VALUES ($1, $2)
      ON CONFLICT (employee_no)
      DO UPDATE SET img64 = EXCLUDED.img64
      RETURNING *;
    `;
    const values = [employeeNo, img64];

    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error al guardar la imagen del usuario');
    }
};

/**
 * Elimina la imagen de un usuario de la tabla user_images.
 */
const deleteUserImage = async (employeeNo) => {
    const query = `
        DELETE FROM user_images
        WHERE employee_no = $1
        RETURNING *;
    `;
    const values = [employeeNo];

    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error al eliminar la imagen del usuario');
    }
};

/**
 * Obtiene la imagen de un usuario a partir de su número de empleado.
 */
const getUserImage = async (employeeNo) => {
    const query = `
        SELECT * FROM user_images
        WHERE employee_no = $1;
    `;
    const values = [employeeNo];

    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error al obtener la imagen del usuario');
    }
};

module.exports = {
    saveUserImage,
    deleteUserImage,
    getUserImage
};
