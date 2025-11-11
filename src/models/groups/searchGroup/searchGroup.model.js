const { client } = require("../../../db/databasepg");

const searchGroupModel = async (groupName) => {

    console.log("searchGroupModel", groupName);
        try {
        const query = 'SELECT * FROM groups WHERE id = $1';
        const result = await client.query(query, [groupName]);

        if (result.rows.length === 0) {
            return {
                error: true,
                statusCode: 404,
                message: 'Grupo no encontrado',
            };
        }

        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

module.exports= {
    searchGroupModel,
}