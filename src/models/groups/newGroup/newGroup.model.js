const { client } = require("../../../db/databasepg");

const newGroupModel = async (groupName) => {
    const sanitizedGroupName = groupName.trim();
    try {
        await client.query('BEGIN');
        const checkQuery = 'SELECT 1 FROM groups WHERE group_name = $1 FOR UPDATE';
        const checkResult = await client.query(checkQuery, [sanitizedGroupName]);

        if (checkResult.rowCount > 0) {
            throw new Error('El nombre del grupo ya existe');
        }

        console.log("sanitizedGroupName", sanitizedGroupName);
        console.log(checkResult.rowCount > 0);

        const insertQuery = 'INSERT INTO groups (group_name) VALUES ($1) RETURNING id, group_name';
        const insertResult = await client.query(insertQuery, [sanitizedGroupName]);

        await client.query('COMMIT');

        return {
            id: insertResult.rows[0].id,
            groupName: insertResult.rows[0].group_name,
        };

    } catch (error) {
        await client.query('ROLLBACK');

        if (error.message === 'El nombre del grupo ya existe') {
            throw {
                message: error.message,
                statusCode: 409
            };
        }

        throw {
            message: 'Error interno al crear el grupo',
            statusCode: 500,
            details: error.message
        };
    }
}

module.exports = {
    newGroupModel
}