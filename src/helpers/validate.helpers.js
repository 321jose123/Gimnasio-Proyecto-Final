const { validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    try {
        validationResult(req).throw();

        return next();
    } catch (error) {
        res.status(403)
        res.send({errors: error.array()})
    }
}

const validateDateRange = (beginTime, endTime) => {
    if (beginTime && endTime) {
        return new Date(beginTime) <= new Date(endTime);
    }
    return false;
};

const formatToUTC = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(Date.UTC(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    )).toISOString().split('.')[0];
};

module.exports = { 
    validateResult,
    formatToUTC,
    validateDateRange
}