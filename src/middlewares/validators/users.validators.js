const { check } = require('express-validator');
const { validateResult } = require('../../helpers/validate.helpers')

const  ValidateCardIdDelete = [
    check('employeeNo')
    .exists()
    .not()
    .isEmpty()
    .withMessage('employeeNo es requerido')
    .isNumeric()
    .withMessage('employeeNo debe ser un numero')
    .isLength({ min: 1, max: 8 })
    .withMessage('employeeNo debe tener entre 1 y 8 caracteres'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

const validateFingerprint = [
    check('fingerNo')
    .exists()
    .not()
    .isEmpty()
    .withMessage('fingerNo es requerido')
    .isNumeric()
    .withMessage('fingerNo debe ser un numero')
    .isLength({ min: 1, max: 5 })
    .withMessage('fingerNo debe tener entre 1 y 5 caracteres'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]
module.exports = {
    ValidateCardIdDelete,
    validateFingerprint
}