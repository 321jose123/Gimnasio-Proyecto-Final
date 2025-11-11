const UserModel = require('../../models/users/user.model');

/**
 * GET /api/user/notes/:employeeNo
 * Obtiene la nota para un usuario específico.
 */
const getUserNote = async (req, res) => {
    const { employeeNo } = req.params;

    try {
        const note = await UserModel.getNoteByEmployeeNo(employeeNo);
        if (note === null && note !== '') { // Permite notas vacías pero no usuarios no encontrados
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado.' 
            });
        }
        res.status(200).json({
            success: true,
            message: 'Nota obtenida correctamente.',
            data: {
                employeeNo,
                nota: note
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener la nota.',
            error: error.message
        });
    }
};

/**
 * POST /api/user/notes
 * Crea una nueva nota para un usuario.
 */
const createUserNote = async (req, res) => {
    const { employeeNo, nota } = req.body;

    if (!employeeNo || typeof nota === 'undefined') {
        return res.status(400).json({
            success: false,
            message: 'Los campos employeeNo y nota son obligatorios.'
        });
    }

    try {
        const updatedUser = await UserModel.upsertNote(employeeNo, nota);
        res.status(201).json({ // 201 Created
            success: true,
            message: 'Nota creada exitosamente.',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear la nota.',
            error: error.message
        });
    }
};

/**
 * PUT /api/user/notes/:employeeNo
 * Actualiza la nota de un usuario existente.
 */
const updateUserNote = async (req, res) => {
    const { employeeNo } = req.params;
    const { nota } = req.body;

    if (typeof nota === 'undefined') {
        return res.status(400).json({
            success: false,
            message: 'El campo nota es obligatorio.'
        });
    }

    try {
        const updatedUser = await UserModel.upsertNote(employeeNo, nota);
        res.status(200).json({
            success: true,
            message: 'Nota actualizada exitosamente.',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar la nota.',
            error: error.message
        });
    }
};

module.exports = {
    getUserNote,
    createUserNote,
    updateUserNote
};

