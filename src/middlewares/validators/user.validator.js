const { check } = require('express-validator');
const { validateResult } = require('../../helpers/validate.helpers')

const validateFingerprint = [
    check('fingerNo')
        .exists().withMessage('fingerNo es requerido')
        .not().isEmpty().withMessage('fingerNo no debe estar vacío')
        .isNumeric().withMessage('fingerNo debe ser un número')
        .isLength({ min: 1, max: 5 }).withMessage('fingerNo debe tener entre 1 y 5 caracteres'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

const validateDeleteUser = [
    check('employeeNo')
        .exists().withMessage('employeeNo es requerido')
        .not().isEmpty().withMessage('employeeNo no debe estar vacío')
        .isNumeric().withMessage('employeeNo debe ser un número')
        .isLength({ min: 1, max: 8 }).withMessage('employeeNo debe tener entre 1 y 8 caracteres'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

module.exports = {
    validateFingerprint,
    validateDeleteUser
}