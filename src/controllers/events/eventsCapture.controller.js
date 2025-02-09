const { HORARIO_EMPRESA_INICIO, HORARIO_EMPRESA_FIN } = require('../../../config');

const hora_inicio = HORARIO_EMPRESA_INICIO;
const hora_final = HORARIO_EMPRESA_FIN

const eventsCapture = async (req, res) => {
    const fecha_inicio = hora_inicio
    const fecha_final = hora_final


    res.status(200).json({ 
        message: 'Event captured successfully',
        status: 'success',
        hora_inicio: fecha_inicio,
        hora_final: fecha_final,
    });
};

module.exports = {
    eventsCapture,
}