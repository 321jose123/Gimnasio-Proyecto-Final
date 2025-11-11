const AccessModel = require('../../models/users/access.model');

const recordAccess = async (req, res) => {
    // Este endpoint puede ser llamado manualmente si es necesario
    const { employeeNo, door_no, serial_no } = req.body;
    if (!employeeNo) {
        return res.status(400).json({ message: "La cédula (employeeNo) es obligatoria." });
    }
    try {
        const result = await AccessModel.decrementAccessAndLog(employeeNo, { door_no, serial_no });
        if (!result) {
            return res.status(404).json({ message: 'Usuario no encontrado o sin accesos disponibles.' });
        }
        res.status(200).json({
            message: 'Acceso registrado y descontado.',
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { recordAccess };