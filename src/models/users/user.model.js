const { client } = require("../../db/databasepg");/**
 * Busca y retorna la información de un usuario a partir de su número de empleado.
 */
const { deleteUserFromDevice } = require("../../services/userServices/buildUserDevice");
const searchUserByEmployeeNo = async (employeeNo) => {
    const query = `
        SELECT * FROM users
        WHERE employee_no = $1
    `;
    const values = [employeeNo];
    const result = await client.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Crea un nuevo usuario en la base de datos.
 */
const createUser = async (userInfo) => {
    const {
        employeeNo, name, userType, doorRight, Valid, RightPlan,
        localUIUserType, userVerifyMode, addUser, gender, email,
        phoneNumber, address, city, country, dateOfBirth, active, accesosDisponibles
    } = userInfo;

    try {
        const checkEmailQuery = `
        SELECT EXISTS (
            SELECT 1 FROM users WHERE email = $1
        );
    `;
    const emailExists = await client.query(checkEmailQuery, [email]);
    if (emailExists.rows[0].exists) {
        throw new Error('El correo electrónico ya está registrado.');
    }

    const checkPhoneQuery = `
        SELECT EXISTS (
            SELECT 1 FROM users WHERE phone_number = $1
        );
    `;
    const phoneExists = await client.query(checkPhoneQuery, [phoneNumber]);
    if (phoneExists.rows[0].exists) {
        throw new Error('El número de teléfono ya está registrado.');
    }
    const doorNo = RightPlan && RightPlan[0] ? RightPlan[0].doorNo : null;
    const planTemplateNo = RightPlan && RightPlan[0] ? RightPlan[0].planTemplateNo : null;
    const query = `
      INSERT INTO users (
          employee_no, name, user_type, door_right,
          valid_enable, valid_begin_time, valid_end_time,
          door_no, plan_template_no,
          local_ui_user_type, user_verify_mode, add_user, gender,
          email, phone_number, address, city, country, date_of_birth, active, accesos_disponibles
      ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21
      )`;


      const values = [
          employeeNo, name, userType, doorRight, Valid.enable, Valid.beginTime, Valid.endTime,
          doorNo, planTemplateNo, localUIUserType, userVerifyMode, addUser, gender, email,
          phoneNumber, address, city, country, dateOfBirth, active, accesosDisponibles
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
        console.log("Error al crear el usuario: " + error.message);
        throw new Error('Error al crear el usuario: ' + error.message);
    }

};

const getUserAccessCount = async (employeeNo) => {
    const query = `
        SELECT accesos_disponibles FROM public.users
        WHERE employee_no = $1
        LIMIT 1;
    `;
    try {
        const result = await client.query(query, [employeeNo]);
        return result.rows.length > 0 ? result.rows[0].accesos_disponibles : 0;
    } catch (error) {
        console.error("Error al obtener accesos disponibles:", error.message);
        return 0;
    }
};

const decrementUserAccess = async (employeeNo) => {
    const query = `
        UPDATE public.users
        SET accesos_disponibles = accesos_disponibles - 1
        WHERE employee_no = $1 AND accesos_disponibles > 0
        RETURNING accesos_disponibles;
    `;
    try {
        const result = await client.query(query, [employeeNo]);

        if (result.rows.length > 0) {
            const accesosRestantes = result.rows[0].accesos_disponibles;

            console.log(`🔽 Usuario ${employeeNo} ahora tiene ${accesosRestantes} accesos disponibles.`);

            if (accesosRestantes === 0) {
                console.log(`⛔ Usuario ${employeeNo} ha sido desactivado por falta de accesos.`);
                await updateUserStatus(employeeNo, false);
            }

            return accesosRestantes;
        } else {
            console.warn(`⚠️ No se encontró registro de accesos para el usuario ${employeeNo}.`);
            return 0;
        }
    } catch (error) {
        console.error("Error al descontar acceso:", error.message);
        return 0;
    }
};

const updateUserStatus = async (employeeNo, status) => {
    console.log(`Intentando actualizar estado del usuario ${employeeNo} a: ${status ? 'Activo' : 'Desactivado'}`);
    try {
        // Actualizar estado en la base de datos
        const query = `
            UPDATE public.users
            SET active = $1
            WHERE employee_no = $2
            RETURNING *;
        `;
        console.log(`Ejecutando query: ${query}`);
        const result = await client.query(query, [status, employeeNo]);
        
        if (!status) {
            console.log(`🚨 Usuario ${employeeNo} desactivado, eliminando del dispositivo.`);
            await deleteUserFromDevice(employeeNo);
            console.log(`✔️ Usuario ${employeeNo} desactivado del dispositivo.`);
            console.log('Usuario eliminado del dispositivo:', await deleteUserFromDevice(employeeNo));
        }

        if (result.rows.length > 0) {
            console.log(`✔️ Estado del usuario ${employeeNo} actualizado a: ${status ? 'Activo' : 'Desactivado'}`);
            return result.rows[0];
        } else {
            console.warn(`⚠️ No se encontró el usuario ${employeeNo} para actualizar.`);
            return null;
        }
    } catch (error) {
        console.error(`Error al actualizar estado del usuario ${employeeNo}:`, error.message);
        return null;
    }
};

const searchCardByCardNo = async (cardNo) => {
    const query = `
        SELECT * FROM user_cards
        WHERE card_no = $1
    `;
    const values = [cardNo];
    const result = await client.query(query, values);
    return result.rows[0];
};



module.exports = {
    createUser,
    searchUserByEmployeeNo,
    searchCardByCardNo,
    getUserAccessCount,
    decrementUserAccess,
    updateUserStatus
};
