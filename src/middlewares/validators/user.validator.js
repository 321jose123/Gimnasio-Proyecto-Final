const { check } = require('express-validator');
const { validateResult } = require('../../helpers/validate.helpers')



const validateDeleteUser = [
    check('employeeNo')
        .exists().withMessage('employeeNo es requerido')
        .not().isEmpty().withMessage('employeeNo no debe estar vacío')
        .isString().withMessage('employeeNo debe ser un string')
        .matches(/^[0-9]+$/).withMessage('employeeNo debe ser un string que contenga solo números'),    (req, res, next) => {
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
        .custom((list) => {
            if (!list.every((no) => /^\d+$/.test(no))) {
                throw new Error('Todos los elementos de EmployeeNoList deben ser números');
            }
            return true;
        }).withMessage('EmployeeNoList contiene elementos no válidos'),
        check('img64')
        .exists().withMessage('img64 es requerido')
        .not().isEmpty().withMessage('img64 no debe estar vacío')
        .custom((value) => {
            const base64Pattern = /^data:image\/(jpeg|png|jpg);base64,[A-Za-z0-9+/=]+$/;
            if (!base64Pattern.test(value)) {
                throw new Error('img64 debe ser una imagen válida en formato base64');
            }
            return true;
        }).withMessage('img64 no contiene un formato base64 válido'),
    ]

const validateAddUser = [
    check('employeeNo')
        .exists().withMessage('employeeNo es requerido')
        .not().isEmpty().withMessage('employeeNo no debe estar vacío')
        .isString().withMessage('employeeNo debe ser un string')
        .matches(/^[0-9]+$/).withMessage('employeeNo debe ser un string que contenga solo números'),
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
    (req, res, next) => {
        validateResult(req, res, next);
    }
]

module.exports = {
    validateDeleteUser,
    validateAddUser,
    validateUserSearch,
    validateUserImage
}