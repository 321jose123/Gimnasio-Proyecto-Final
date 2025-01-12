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

const validateAddFingerprintToUser = [
    check('FingerPrintCfg').exists().withMessage('FingerPrintCfg es requerido'),
  
    check('FingerPrintCfg.employeeNo')
      .exists().withMessage('employeeNo es requerido')
      .isNumeric().withMessage('employeeNo debe ser un número'),
  
    check('FingerPrintCfg.enableCardReader')
      .isArray({ min: 1 }).withMessage('enableCardReader debe ser un arreglo con al menos un elemento'),
  
    check('FingerPrintCfg.fingerPrintID')
      .exists().withMessage('fingerPrintID es requerido')
      .isNumeric().withMessage('fingerPrintID debe ser un número'),
  
    check('FingerPrintCfg.deleteFingerPrint')
      .exists().withMessage('deleteFingerPrint es requerido')
      .isBoolean().withMessage('deleteFingerPrint debe ser un valor booleano'),
  
    check('FingerPrintCfg.fingerType')
      .exists().withMessage('fingerType es requerido')
      .isIn(['normalFP', 'leaderFP']).withMessage('fingerType debe ser normalFP o leaderFP'),
  
    check('FingerPrintCfg.fingerData')
      .exists().withMessage('fingerData es requerido')
      .notEmpty().withMessage('fingerData no debe estar vacío'),
  
    check('FingerPrintCfg.leaderFP')
      .isArray({ min: 1 }).withMessage('leaderFP debe ser un arreglo con al menos un elemento'),
  
    check('FingerPrintCfg.checkEmployeeNo')
      .exists().withMessage('checkEmployeeNo es requerido')
      .isBoolean().withMessage('checkEmployeeNo debe ser un valor booleano'),
  
    (req, res, next) => {
      validateResult(req, res, next);
    }
  ];

module.exports = {
    validateFingerprint,
    validateAddFingerprintToUser
}