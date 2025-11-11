const usersModels = require('../../models/users/user.model');

const listAllUsers = async (req, res) => {
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    if(!page || !pageSize || isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
        return res.status(400).send('Error al obtener la lista de usuarios, faltan parámetros');
    }
    try {
        const dataList = await usersModels.getAllUsers(page, pageSize);

        res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos correctamente',
            source: 'database',
            data: dataList
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la lista de usuarios',
            error: error.message
        });
    }
}

module.exports = {
    listAllUsers
}