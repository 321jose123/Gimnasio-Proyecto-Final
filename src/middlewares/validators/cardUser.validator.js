const { check } = require('express-validator');
const { validateResult } = require('../../helpers/validate.helpers')

const validateCardAddToUser = [
    check('employeeNo')
        .exists().withMessage('employeeNo es requerido')
        .not().isEmpty().withMessage('employeeNo no debe estar vacío')
        .isNumeric().withMessage('employeeNo debe ser un número')
        .isLength({ min: 1, max: 8 }).withMessage('employeeNo debe tener entre 1 y 8 caracteres'),

    check('cardNo')
        .exists().withMessage('cardNo es requerido')
        .not().isEmpty().withMessage('cardNo no debe estar vacío')
        .isNumeric().withMessage('cardNo debe ser un número'),

    check('deleteCard')
        .exists().withMessage('deleteCard es requerido')
        .isBoolean().withMessage('deleteCard debe ser un booleano'),

    check('cardType')
        .exists().withMessage('cardType es requerido')
        .not().isEmpty().withMessage('cardType no debe estar vacío')
        .isString().withMessage('cardType debe ser una cadena')
        .isIn(['normalCard', 'patrolCard', 'hijackCard', 'superCard', 'dismissingCard', 'emergencyCard'])
        .withMessage('cardType debe ser uno de los siguientes: normalCard, patrolCard, hijackCard, superCard, dismissingCard, emergencyCard'),

    check('checkCardNo')
        .exists().withMessage('checkCardNo es requerido')
        .isBoolean().withMessage('checkCardNo debe ser un booleano'),

    check('checkEmployeeNo')
        .exists().withMessage('checkEmployeeNo es requerido')
        .isBoolean().withMessage('checkEmployeeNo debe ser un booleano'),

    check('addCard')
        .exists().withMessage('addCard es requerido')
        .isBoolean().withMessage('addCard debe ser un booleano'),

    (req, res, next) => {
        validateResult(req, res, next);
    }
];

const validateCardIdFromUser = [
    check('searchResultPosition')
        .exists().withMessage('searchResultPosition es requerido')
        .not().isEmpty().withMessage('searchResultPosition no debe estar vacío')
        .isNumeric().withMessage('searchResultPosition debe ser un número'),

    check('maxResults')
        .exists().withMessage('maxResults es requerido')
        .not().isEmpty().withMessage('maxResults no debe estar vacío')
        .isNumeric().withMessage('maxResults debe ser un número'),

    check('employeeNo')
        .exists().withMessage('employeeNo es requerido')
        .not().isEmpty().withMessage('employeeNo no debe estar vacío')
        .isNumeric().withMessage('employeeNo debe ser un número')
        .isLength({ min: 1, max: 8 }).withMessage('employeeNo debe tener entre 1 y 8 caracteres'),

    (req, res, next) => {
        validateResult(req, res, next);
    }
]

const  validateCardIdDelete = [
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
    validateCardIdDelete,
    validateCardAddToUser,
    validateCardIdFromUser
}