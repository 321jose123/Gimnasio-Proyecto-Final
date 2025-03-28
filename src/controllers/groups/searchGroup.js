const { searchGroupModel } = require("../../models/groups/searchGroup/searchGroup.model");

const searchGroup = async (req, res) => {
    const { groupName } = req.body;

    try {
        const modelResponse = await searchGroupModel(groupName)
        if (modelResponse.error) {
            return res.status(modelResponse.statusCode || 500).send(modelResponse);
        }
        res.status(201).json({
            message: 'Grupo encontrado exitosamente',
            group: modelResponse
        });
    } catch (error) {
        console.error('Error al crear el grupo:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error al crear el grupo',
            ...(error.details && { details: error.details })
        });
    };
}

module.exports = {
    searchGroup,
}