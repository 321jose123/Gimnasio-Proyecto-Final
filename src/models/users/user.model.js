const { searchGroup } = require("../../controllers/groups/searchGroup");
const { client } = require("../../db/databasepg");/**
 * Busca y retorna la información de un usuario a partir de su número de empleado.
 */

const { updateUserTimeAccessInDevice } = require("../../services/userServices/buildUserDevice");
const { DateTime } = require("luxon");
const { searchGroupModel } = require("../groups/searchGroup/searchGroup.model");


const outdatedUser = async (employeeNo, fechaDesactivacion, cincoSegundosDespuesDeDesactivacion) => {


    const query = `
        UPDATE users
        SET valid_begin_time = $2, 
        valid_end_time = $3
        WHERE employee_no = $1
        RETURNING *;
    `;
    const values = [employeeNo, fechaDesactivacion, cincoSegundosDespuesDeDesactivacion];
    const result = await client.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
};

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
 * Busca usuarios con 2 accesos diarios que tengan accesos disponibles y estén inactivos.
 * @returns {Promise<Array>} - Array con los usuarios que cumplen los criterios
 */
const getUsersWithTwoDailyAccessesForActivation = async () => {
    const query = `
        SELECT * FROM users
        WHERE acc_diarios = 2 
        AND accesos_disponibles > 0 
        AND active = false
        ORDER BY employee_no;
    `;

    try {
        const result = await client.query(query);

        if (result.rows.length > 0) {
            console.log(`🔍 Se encontraron ${result.rows.length} usuarios con 2 accesos diarios disponibles para activación.`);
        } else {
            console.log('⚠️ No se encontraron usuarios con 2 accesos diarios que cumplan los criterios de activación.');
        }

        return result.rows;
    } catch (error) {
        console.error('❌ Error al obtener usuarios con 2 accesos diarios para activación:', error.message);
        throw new Error(`Error al obtener usuarios con 2 accesos diarios: ${error.message}`);
    }
};



const getAllUsers = async (page = 1, pageSize = 10) => {

    const offset = (page - 1) * pageSize;

    const query = `
        SELECT * FROM users
        ORDER BY employee_no
        LIMIT $1 OFFSET $2
    `;
    const values = [pageSize, offset];

    try {
        const result = await client.query(query, values);

        const totalQuery = 'SELECT COUNT(*) FROM users';
        const totalResult = await client.query(totalQuery);
        const totalUsers = totalResult.rows[0].count;

        return {
            totalUsers: totalUsers,
            users: result.rows,
        };
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        throw new Error('Error al obtener los usuarios, ', error);
    }
};


/**
 * Crea un nuevo usuario en la base de datos.
 */
const createUser = async (userInfo) => {
    const {
        employeeNo, name, userType, doorRight, Valid, RightPlan,
        localUIUserType, userVerifyMode, addUser, gender, email,
        phoneNumber, address, city, country, dateOfBirth, active, accesosDisponibles, groupID, acc_diarios
    } = userInfo;

    const sanitizedGroupID = groupID ? parseInt(groupID) : null;

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

        const checkGroupIDExist = `
        SELECT EXISTS (
            SELECT 1 FROM groups WHERE id = $1
        );
    `;
        const groupIDExists = await client.query(checkGroupIDExist, [sanitizedGroupID]);
        if (!groupIDExists.rows[0].exists) {
            throw new Error('El grupo no existe.');
        }

        const query = `
      INSERT INTO users (
          employee_no, name, user_type, door_right,
          valid_enable, valid_begin_time, valid_end_time,
          door_no, plan_template_no,
          local_ui_user_type, user_verify_mode, add_user, gender,
          email, phone_number, address, city, country, date_of_birth, active, accesos_disponibles, group_id, acc_diarios
      ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )`;


        const values = [
            employeeNo, name, userType, doorRight, Valid.enable, Valid.beginTime, Valid.endTime,
            doorNo, planTemplateNo, localUIUserType, userVerifyMode, addUser, gender, email,
            phoneNumber, address, city, country, dateOfBirth, active, accesosDisponibles, groupID,
            acc_diarios
        ];

        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.log("Error al crear el usuario: " + error.message);
        throw new Error('Error al crear el usuario: ' + error.message);
    }

};

const updateUser = async (userData) => {
    const {
        employeeNo, name, userType, doorRight, validEnable, validBeginTime, validEndTime,
        planTemplateNo, localUIUserType, userVerifyMode, addUser, gender, email,
        phoneNumber, address, city, country, dateOfBirth, active, accesosDisponibles, groupID
    } = userData;

    try {
        // Verificar si ya existe un usuario con el mismo email o teléfono
        const checkExistsQuery = `
        SELECT EXISTS (
          SELECT 1 FROM users WHERE
            ($1 = email OR $2 = phone_number) AND
            employee_no != $3
        );
      `;
        const exists = await client.query(checkExistsQuery, [email, phoneNumber, employeeNo]);
        if (exists.rows[0].exists) {
            return {
                error: true,
                status: 400,
                message: 'El correo electrónico o número de teléfono ya están registrados.'
            };
        }

        const checkGroupIDExist = `
        SELECT EXISTS (
            SELECT 1 FROM groups WHERE id = $1
        );
    `;
        const groupIDExists = await client.query(checkGroupIDExist, [groupID]);
        if (!groupIDExists.rows[0].exists) {
            throw new Error('El grupo no existe.');
        }

        // Actualizar el usuario en la base de datos
        const query = `
        UPDATE users SET
          name = $1,
          user_type = $2,
          door_right = $3,
          valid_enable = $4,
          valid_begin_time = $5,
          valid_end_time = $6,
          plan_template_no = $7,
          local_ui_user_type = $8,
          user_verify_mode = $9,
          add_user = $10,
          gender = $11,
          email = $12,
          phone_number = $13,
          address = $14,
          city = $15,
          country = $16,
          date_of_birth = $17,
          active = $18,
          accesos_disponibles = $19,
          group_id = $20
        WHERE employee_no = $21
        RETURNING *
      `;

        const values = [
            name, userType, doorRight, validEnable, validBeginTime, validEndTime,
            planTemplateNo, localUIUserType, userVerifyMode, addUser, gender, email,
            phoneNumber, address, city, country, dateOfBirth, active, accesosDisponibles, groupID, employeeNo
        ];

        const result = await client.query(query, values);
        if (result.rowCount === 0) {
            return {
                error: true,
                status: 400,
                message: 'No se pudo actualizar el usuario.'
            };
        }

        return {
            error: false,
            data: result.rows[0]
        };
    } catch (error) {
        console.error('Error en modelo updateUser:', error);
        return {
            error: true,
            status: 500,
            message: `Error interno en la base de datos: ${error.message}`,
        };
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

const getUserDailyAccessCount = async (employeeNo) => {
    const query = `
        SELECT acc_diarios FROM public.users
        WHERE employee_no = $1
        LIMIT 1;
    `;
    try {
        const result = await client.query(query, [employeeNo]);
        return result.rows.length > 0 ? result.rows[0].acc_diarios : 0;
    } catch (error) {
        console.error("Error al obtener accesos disponibles:", error.message);
        return 0;
    }
};

const restartUserDailyAccess = async () => {
    const query = `
        UPDATE public.users
        SET acc_diarios = 2;
    `;
    try {
        await client.query(query);
        console.log("Accesos diarios reiniciados.");
        return true;
    } catch (error) {
        console.error("Error al reiniciar accesos diarios:", error.message);
    }
}

const decrementUserDailyAccess = async (employeeNo) => {
    const query = `
        UPDATE public.users
        SET acc_diarios = acc_diarios - 1
        WHERE employee_no = $1 AND acc_diarios > 0
        RETURNING acc_diarios;
    `;
    try {
        const result = await client.query(query, [employeeNo]);

        if (result.rows.length > 0) {
            const accesosRestantes = result.rows[0].acc_diarios;

            console.log(`🔽 Usuario ${employeeNo} ahora tiene ${accesosRestantes} accesos disponibles.`);

            if (accesosRestantes === 0) {
                console.log(`⛔ Usuario ${employeeNo} ha sido desactivado por falta de accesos.`);
                const fechaDesactivacion = DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
                const cincoSegundosDespuesDeDesactivacion = DateTime.fromISO(fechaDesactivacion).plus({ seconds: 5 }).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
                const updateUserStatusResponse = await updateUserStatusDaily(employeeNo, false);
                if (updateUserStatusResponse.error) {
                    console.error('Error al desactivar el usuario en el dispositivo:', updateUserStatusResponse.error);
                }
                const updateUserResponse = await updateUserTimeAccessInDevice(employeeNo, fechaDesactivacion, cincoSegundosDespuesDeDesactivacion);

                if (updateUserResponse.error) {
                    console.error('Error al actualizar el usuario en el dispositivo:', updateUserResponse.error);
                }
                console.log("updateUserResponse", updateUserResponse);

            }

            return accesosRestantes;
        }
    } catch (error) {
        console.error(`Error al decrementar el acceso diario del usuario ${employeeNo}:`, error.message);
        return null;
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
                const fechaDesactivacion = DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
                const cincoSegundosDespuesDeDesactivacion = DateTime.fromISO(fechaDesactivacion).plus({ seconds: 5 }).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
                const updateUserStatusResponse = await updateUserStatus(employeeNo, false);
                if (updateUserStatusResponse.error) {
                    console.error('Error al desactivar el usuario en el dispositivo:', updateUserStatusResponse.error);
                }
                const updateUserResponse = await updateUserTimeAccessInDevice(employeeNo, fechaDesactivacion, cincoSegundosDespuesDeDesactivacion);

                if (updateUserResponse.error) {
                    console.error('Error al actualizar el usuario en el dispositivo:', updateUserResponse.error);
                }
                console.log("updateUserResponse", updateUserResponse);

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

    const fechaDesactivacion = DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
    const cincoSegundosDespuesDeDesactivacion = DateTime.fromISO(fechaDesactivacion).plus({ seconds: 5 }).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

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
            const updateUserTimeAccessInDBResponse = await updateUserAccessTime(employeeNo, fechaDesactivacion, cincoSegundosDespuesDeDesactivacion);

            // await deleteUserFromDevice(employeeNo);
            console.log(`✔️ Usuario ${employeeNo} desactivado del dispositivo.`);
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

const updateUserStatusDaily = async (employeeNo, status) => {
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

const updateUserAccessTime = async (employeeNo, beginTime, endTime) => {
    console.log(`Intentando actualizar acceso del usuario ${employeeNo} a: ${beginTime} - ${endTime}`);

    try {
        const query = `
            UPDATE public.users
            SET valid_begin_time = $1, valid_end_time = $2
            WHERE employee_no = $3
            RETURNING *;
        `;
        const result = await client.query(query, [beginTime, endTime, employeeNo]);

        if (result.rows.length > 0) {
            console.log(`✔️ Acceso del usuario ${employeeNo} actualizado a: ${beginTime} - ${endTime}`);
            return result.rows[0];
        } else {
            console.warn(`⚠️ No se encontró el usuario ${employeeNo} para actualizar.`);
            return null;
        }
    } catch (error) {
        console.error(`Error al actualizar acceso del usuario ${employeeNo}:`, error.message);
        return null;
    }

}

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
    getUsersWithTwoDailyAccessesForActivation,
    getAllUsers,
    searchCardByCardNo,
    getUserAccessCount,
    decrementUserAccess,
    updateUserStatus,
    updateUserStatusDaily,
    updateUserAccessTime,
    updateUser,
    outdatedUser,
    restartUserDailyAccess,
    getUserDailyAccessCount,
    decrementUserDailyAccess,
};
