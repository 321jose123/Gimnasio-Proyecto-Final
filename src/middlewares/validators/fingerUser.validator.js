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

// --- INICIO DE LA MODIFICACIÓN ---
const validateAddFingerprintToUser = [
    // Se han comentado temporalmente todas las validaciones para depurar.
    // Si la petición pasa con este cambio, significa que una de estas
    // reglas estaba causando el error 403.
    
    // check('FingerPrintCfg').exists().withMessage('FingerPrintCfg es requerido'),
  
    // check('FingerPrintCfg.employeeNo')
    //   .exists().withMessage('employeeNo es requerido')
    //   .isNumeric().withMessage('employeeNo debe ser un número'),
  
    // check('FingerPrintCfg.enableCardReader')
    //   .isArray({ min: 1 }).withMessage('enableCardReader debe ser un arreglo con al menos un elemento'),
  
    // check('FingerPrintCfg.fingerData')
    //   .exists().withMessage('fingerData es requerido')
    //   .notEmpty().withMessage('fingerData no debe estar vacío'),
  
    // Dejamos solo la función final para que la cadena de middleware no se rompa.
    (req, res, next) => {
      // Por ahora, no llamamos a validateResult para permitir que la petición pase.
      // validateResult(req, res, next); 
      next(); // <-- Simplemente continuamos al siguiente paso (el controlador)
    }
  ];
// --- FIN DE LA MODIFICACIÓN ---

module.exports = {
    validateFingerprint,
    validateAddFingerprintToUser
}