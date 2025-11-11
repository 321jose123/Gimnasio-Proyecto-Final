const handleError = (res, error, message) => {
    console.error(message, error);
    res.status(500).json({
        message,
        error: error.message,
        data: error.response?.data,
    });
};

module.exports = {
    handleError,
};