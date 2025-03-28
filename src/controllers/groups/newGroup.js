const { newGroupModel } = require("../../models/groups/newGroup/newGroup.model");


const newGroup = async (req, res) => {
    const { groupName } = req.body;

    try {
        const modelResponse = await newGroupModel(groupName)
        if (modelResponse.error) {
            return res.status(modelResponse.statusCode || 500).send(modelResponse);
        }
        res.status(201).json({
            message: 'Grupo creado exitosamente',
            group: newGroup
        });
    } catch (error) {
        console.error('Error al crear el grupo:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error al crear el grupo',
            ...(error.details && { details: error.details })
        });
    }
};

module.exports = {
    newGroup
};