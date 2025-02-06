const { client } = require("../../db/databasepg");

/**
 * Busca y retorna la información de un usuario a partir de su número de empleado.
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
 */
const createUser = async (userInfo) => {
    const {
        employeeNo, name, userType, doorRight, Valid, RightPlan,
        localUIUserType, userVerifyMode, addUser, gender, email,
        phoneNumber, address, city, country, dateOfBirth, active
    } = userInfo;

    const doorNo = RightPlan && RightPlan[0] ? RightPlan[0].doorNo : null;
    const planTemplateNo = RightPlan && RightPlan[0] ? RightPlan[0].planTemplateNo : null;

    const query = `
      INSERT INTO users (
          employee_no, name, user_type, door_right,
          valid_enable, valid_begin_time, valid_end_time,
          door_no, plan_template_no,
          local_ui_user_type, user_verify_mode, add_user, gender,
          email, phone_number, address, city, country, date_of_birth, active
      ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *;
    `;

    const values = [
        employeeNo, name, userType, doorRight, Valid.enable, Valid.beginTime, Valid.endTime,
        doorNo, planTemplateNo, localUIUserType, userVerifyMode, addUser, gender, email,
        phoneNumber, address, city, country, dateOfBirth, active
    ];

    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error('Error al crear el usuario');
    }
};

module.exports = {
    createUser,
    searchUserByEmployeeNo
};
