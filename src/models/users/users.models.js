const { client } = require("../../db/databasepg");

/**
 * Busca y retorna la información de un usuario a partir de su número de empleado.
 *
 * @async
 * @function searchUserByEmployeeNo
 * @param {string} employeeNo - Número de empleado del usuario.
 * @returns {Promise<Object|null>} - Objeto del usuario encontrado o null si no existe.
 * @throws {Error} - Lanza un error si ocurre algún problema al ejecutar la consulta.
 */
const searchUserByEmployeeNo = async (employeeNo) => {
    const query = `
        SELECT * FROM users
        WHERE employee_no = $1
    `;
    const values = [employeeNo];
    const result = await client.query(query, values);
    return result.rows[0];
};

/**
 * Crea un nuevo usuario en la base de datos.
 *
 * @async
 * @function createUser
 * @param {Object} userInfo - Objeto con la información del usuario.
 * @param {string} userInfo.employeeNo - Número de empleado del usuario.
 * @param {string} userInfo.name - Nombre del usuario.
 * @param {string} userInfo.userType - Tipo de usuario (por ejemplo, "normal", "visitor", etc.).
 * @param {string} userInfo.doorRight - Derecho de acceso del usuario.
 * @param {Object} userInfo.Valid - Objeto con la información de validez del usuario.
 * @param {boolean} userInfo.Valid.enable - Indica si la validez está habilitada.
 * @param {string} userInfo.Valid.beginTime - Fecha de inicio de la validez (en formato compatible con PostgreSQL).
 * @param {string} userInfo.Valid.endTime - Fecha de fin de la validez.
 * @param {Array<Object>} userInfo.RightPlan - Arreglo con la información del plan de acceso.
 * @param {number} userInfo.RightPlan[].doorNo - Número de puerta.
 * @param {string} userInfo.RightPlan[].planTemplateNo - Plantilla del plan.
 * @param {string} userInfo.localUIUserType - Tipo de usuario para la interfaz local.
 * @param {string} userInfo.userVerifyMode - Modo de verificación del usuario.
 * @param {boolean} userInfo.addUser - Bandera que indica si se debe agregar el usuario.
 * @param {string} userInfo.gender - Género del usuario ("male" o "female").
 * @param {string} userInfo.email - Correo electrónico del usuario.
 * @param {string} userInfo.phoneNumber - Número de celular del usuario.
 * @param {string} userInfo.address - Dirección de residencia del usuario.
 * @param {string} userInfo.city - Ciudad del usuario.
 * @param {string} userInfo.country - País del usuario.
 * @param {string} userInfo.dateOfBirth - Fecha de nacimiento del usuario (formato YYYY-MM-DD).
 * @returns {Promise<Object>} - Objeto con la información del usuario creado.
 * @throws {Error} - Lanza un error si ocurre algún problema al ejecutar la consulta.
 */
const createUser = async (userInfo) => {
    const {
        employeeNo,
        name,
        userType,
        doorRight,
        Valid,
        RightPlan,
        localUIUserType,
        userVerifyMode,
        addUser,
        gender,
        email,
        phoneNumber,
        address,
        city,
        country,
        dateOfBirth,
    } = userInfo;

    const doorNo = RightPlan && RightPlan[0] ? RightPlan[0].doorNo : null;
    const planTemplateNo = RightPlan && RightPlan[0] ? RightPlan[0].planTemplateNo : null;

    const query = `
      INSERT INTO users (
          employee_no, name, user_type, door_right,
          valid_enable, valid_begin_time, valid_end_time,
          door_no, plan_template_no,
          local_ui_user_type, user_verify_mode, add_user, gender,
          email, phone_number, address, city, country, date_of_birth
      ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19
      )
      RETURNING *;
    `;

    const values = [
        employeeNo,
        name,
        userType,
        doorRight,
        Valid.enable,
        Valid.beginTime,
        Valid.endTime,
        doorNo,
        planTemplateNo,
        localUIUserType,
        userVerifyMode,
        addUser,
        gender,
        email,
        phoneNumber,
        address,
        city,
        country,
        dateOfBirth,
    ];

    try {
        console.log('Executing query:', query);
        console.log('With values:', values);

        const result = await client.query(query, values);
        console.log('Result:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        throw new Error('Error al crear el usuario');
    }
};

/**
 * Inserta o actualiza la imagen del usuario en la tabla user_images.
 * Si ya existe una imagen para el employeeNo proporcionado, se actualiza con el nuevo valor.
 *
 * @async
 * @function saveUserImage
 * @param {string} employeeNo - Número de empleado del usuario.
 * @param {string} img64 - Imagen en formato Base64.
 * @returns {Promise<Object>} - Objeto con la información de la imagen insertada o actualizada.
 * @throws {Error} - Lanza un error si ocurre algún problema al ejecutar la consulta.
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
      console.error('Error al guardar la imagen del usuario:', error);
      throw new Error('Error al guardar la imagen del usuario');
    }
};
  
/**
 * Elimina la imagen de un usuario de la tabla user_images.
 *
 * @async
 * @function deleteUserImage
 * @param {string} employeeNo - Número de empleado del usuario cuya imagen se eliminará.
 * @returns {Promise<Object>} - Objeto con la información de la imagen eliminada.
 * @throws {Error} - Lanza un error si ocurre algún problema al ejecutar la consulta.
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
        console.error('Error al eliminar la imagen del usuario:', error);
        throw new Error('Error al eliminar la imagen del usuario');
    }
}

/**
 * Obtiene la imagen de un usuario a partir de su número de empleado.
 *
 * @async
 * @function getUserImage
 * @param {string} employeeNo - Número de empleado del usuario.
 * @returns {Promise<Object|null>} - Objeto con la imagen del usuario o null si no se encuentra.
 * @throws {Error} - Lanza un error si ocurre algún problema al ejecutar la consulta.
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
        console.error('Error al obtener la imagen del usuario:', error);
        throw new Error('Error al obtener la imagen del usuario');
    }
};

/**
 * Elimina un usuario y sus imágenes asociadas de la base de datos usando su número de empleado.
 *
 * @async
 * @function deleteUserByEmployeeNo
 * @param {string} employeeNo - Número de empleado del usuario a eliminar.
 * @returns {Promise<Object|null>} - Objeto con la información del usuario eliminado o null si no se encontró.
 * @throws {Error} - Lanza un error si ocurre algún problema al ejecutar las consultas.
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
        console.error('Error al eliminar el usuario:', error);
        throw new Error('Error al eliminar el usuario');
    }
};

module.exports = {
    createUser,
    getUserImage,
    saveUserImage,
    deleteUserImage,
    searchUserByEmployeeNo,
    deleteUserByEmployeeNo
};
