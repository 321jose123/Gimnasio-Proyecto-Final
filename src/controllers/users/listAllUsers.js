// src/controllers/users/listAllUsers.js

const usersModels = require('../../models/users/user.model');

const listAllUsers = async (req, res) => {
    try {
        // 1. Leemos 'page', 'limit' y el NUEVO 'search'
        // OJO: Tu frontend envía 'limit', no 'pageSize'. Lo corregí aquí.
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Corregido de 'pageSize' a 'limit'
        const search = req.query.search || ''; // <-- ¡LA LÍNEA MÁS IMPORTANTE!

        // 2. Validamos los números de paginación
        if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros de paginación (page, limit) inválidos.'
            });
        }

        // 3. Pasamos TODOS los parámetros (incluyendo 'search') al modelo
        // Esta es la función 'getAllUsers' de 'user.model.js' que ya modificamos
        const dataList = await usersModels.getAllUsers(page, limit, search);

        // 4. Devolvemos la respuesta
        res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos correctamente',
            source: 'database',
            data: dataList // dataList ya contiene { totalUsers, users }
        });

    } catch (error) {
        console.error('Error en listAllUsers controller:', error); // Es buena práctica loguear el error
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