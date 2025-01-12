const { check } = require('express-validator');
const { validateResult } = require('../../helpers/validate.helpers')

const validateFingerprint = [
    check('fingerNo')
        .exists().withMessage('fingerNo es requerido')
        .not().isEmpty().withMessage('fingerNo no debe estar vacío')
        .isNumeric().withMessage('fingerNo debe ser un número')
        .isLength({ max: 1, max: 5 }).withMessage('fingerNo debe tener 1 caracter'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

module.exports = {
    validateFingerprint
}