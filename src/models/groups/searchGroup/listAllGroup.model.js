const { client } = require("../../../db/databasepg");

const listAllGroupModel = async () => {
    try {
        client.query('BEGIN');

        client.query('COMMIT');
        const result = await client.query('SELECT * FROM groups');
        return result.rows;
    } catch (error) {
        console.error('Error al obtener los grupos:', error);
        throw new Error('Error al obtener los grupos, ', error);
    }
};

module.exports = {
    listAllGroupModel
};