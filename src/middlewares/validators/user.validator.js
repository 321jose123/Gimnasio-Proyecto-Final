const { check } = require('express-validator');
const { validateResult } = require('../../helpers/validate.helpers')



const validateDeleteUser = [
    check('employeeNo')
        .exists().withMessage('employeeNo es requerido')
        .not().isEmpty().withMessage('employeeNo no debe estar vacío')
        .isString().withMessage('employeeNo debe ser un string')
        .matches(/^[0-9]+$/).withMessage('employeeNo debe ser un string que contenga solo números'), (req, res, next) => {
            validateResult(req, res, next);
        }
]

const validateUserSearch = [
    check('EmployeeNoList')
        .exists().withMessage('EmployeeNoList es requerido')
        .not().isEmpty().withMessage('EmployeeNoList no debe estar vacío')
        .isArray().withMessage('EmployeeNoList debe ser un array')
        .matches(/^[0-9]+$/).withMessage('EmployeeNoList debe ser un string que contenga solo números'),
    check('fuzzySearch')
        .optional()
        .isString().withMessage('fuzzySearch debe ser un string'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

const validateUserImage = [
    check('EmployeeNoList')
        .exists().withMessage('EmployeeNoList es requerido')
        .isArray({ min: 1 }).withMessage('EmployeeNoList debe ser un arreglo con al menos un elemento')
        .matches(/^[0-9]+$/).withMessage('EmployeeNoList debe ser un string que contenga solo números'),
    check('img64')
        .exists().withMessage('img64 es requerido')
        .not().isEmpty().withMessage('img64 no debe estar vacío')
        .isString().withMessage('img64 debe ser un string')
        .matches(/^\S+$/).withMessage('img64 no debe contener espacios'),
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

const validateAddUser = [
    check('employeeNo')
        .exists().withMessage('employeeNo es requerido')
        .not().isEmpty().withMessage('employeeNo no debe estar vacío')
        .isString().withMessage('employeeNo debe ser un string')
        .matches(/^[0-9]+$/).withMessage('employeeNo debe contener solo números'),
    check('name')
        .exists().withMessage('name es requerido')
        .not().isEmpty().withMessage('name no debe estar vacío')
        .isString().withMessage('name debe ser un string'),
    check('userType')
        .exists().withMessage('userType es requerido')
        .isIn(['normal', 'visitor', 'blackList']).withMessage('userType debe ser normal, visitor o blackList'),
    check('doorRight')
        .exists().withMessage('doorRight es requerido')
        .isString().withMessage('doorRight debe ser un string'),
    check('Valid.beginTime')
        .exists().withMessage('Valid.beginTime es requerido')
        .isISO8601().withMessage('Valid.beginTime debe ser una fecha válida'),
    check('Valid.endTime')
        .exists().withMessage('Valid.endTime es requerido')
        .isISO8601().withMessage('Valid.endTime debe ser una fecha válida'),
    check('RightPlan')
        .isArray({ min: 1, max: 2 }).withMessage('RightPlan debe ser un arreglo con uno o dos elementos'),
    check('RightPlan.*.doorNo')
        .exists().withMessage('RightPlan.doorNo es requerido')
        .isNumeric().withMessage('RightPlan.doorNo debe ser un número'),
    check('RightPlan.*.planTemplateNo')
        .exists().withMessage('RightPlan.planTemplateNo es requerido')
        .isString().withMessage('RightPlan.planTemplateNo debe ser un string'),
    check('userVerifyMode')
        .exists().withMessage('userVerifyMode es requerido')
        .isIn(['faceOrFpOrCardOrPw', 'face', 'fp', 'card']).withMessage('userVerifyMode debe ser un modo válido'),
    check('gender')
        .exists().withMessage('gender es requerido')
        .isIn(['male', 'female']).withMessage('gender debe ser male o female'),

    // Nuevos campos para información personal
    check('email')
        .exists().withMessage('email es requerido')
        .isEmail().withMessage('email debe ser un correo electrónico válido'),

    check('phoneNumber')
        .optional()
        .isString().withMessage('phoneNumber debe ser un string'),

    check('address')
        .optional()
        .isString().withMessage('address debe ser un string'),

    check('city')
        .optional()
        .isString().withMessage('city debe ser un string'),

    check('state')
        .optional()
        .isString().withMessage('state debe ser un string'),

    check('postalCode')
        .optional()
        .isString().withMessage('postalCode debe ser un string'),

    check('country')
        .optional()
        .isString().withMessage('country debe ser un string'),

    check('dateOfBirth')
        .optional()
        .isISO8601().withMessage('dateOfBirth debe ser una fecha válida (formato ISO8601)'),

    (req, res, next) => {
        validateResult(req, res, next);
    }
];

module.exports = {
    validateDeleteUser,
    validateAddUser,
    validateUserSearch,
    validateUserImage
}