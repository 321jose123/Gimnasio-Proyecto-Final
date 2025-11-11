const { listAllGroupModel } = require("../../models/groups/searchGroup/listAllGroup.model");

const listAllGroups = async (req, res) => {
    try {

        const responseModel = await listAllGroupModel();
        if (responseModel.error) {
            return res.status(responseModel.statusCode || 500).send(responseModel);
        }
        const data = responseModel;

        return res.status(200).json({
            message: 'Grupos obtenidos correctamente',
            data: data
        })
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener grupos',
            error: error.message,
        });
    }
};

module.exports = {
    listAllGroups
}