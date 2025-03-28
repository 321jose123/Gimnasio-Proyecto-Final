const { check } = require('express-validator');
const { validateResult } = require('../../helpers/validate.helpers')


const validateNewGroup = [
    check('groupName')
        .exists().withMessage('groupName es requerido')
        .not().isEmpty().withMessage('groupName no debe estar vacío')
        .isString().withMessage('groupName debe ser un string')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

const validateSearchGroup = [
    check('groupName')
        .exists().withMessage('groupName es requerido')
        .not().isEmpty().withMessage('groupName no debe estar vacío'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

module.exports = {
    validateNewGroup,
    validateSearchGroup,
}