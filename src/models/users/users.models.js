const { client } = require("../../db/databasepg");

const searchUserByEmployeeNo = async (employeeNo) => {
    const query = `
        SELECT * FROM users
        WHERE employee_no = $1
    `;
    const values = [employeeNo];
    const result = await client.query(query, values);
    return result.rows[0];
};

const createUser = async (userInfo) => {
    const { employeeNo, name, userType, doorRight, Valid, RightPlan, localUIUserType, userVerifyMode, addUser, gender } = userInfo;

    const query = `
    INSERT INTO users (
        employee_no, name, user_type, door_right, valid_enable, valid_begin_time,
        valid_end_time, door_no, plan_template_no, local_ui_user_type, user_verify_mode, add_user, gender
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
`;

    const values = [
        employeeNo, name, userType, doorRight, Valid.enable, Valid.beginTime, Valid.endTime,
        RightPlan[0]?.doorNo, RightPlan[0]?.planTemplateNo, localUIUserType,
        userVerifyMode, addUser, gender
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

const saveUserImage = async (employeeNo, img64) => {
    const query = `
        INSERT INTO user_images (employee_no, img64)
        VALUES ($1, $2)
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