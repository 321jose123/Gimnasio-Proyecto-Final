const { API_USERNAME, API_PASSWORD } = process.env;
const { apiService } = require('../../services/apiServices');
const { API_URL_STREAMING } = require('../../../config');

const validateStreaming = async (req, res) => {
    try {
        const data = await apiService.get(
            API_URL_STREAMING, 
            API_USERNAME, 
            API_PASSWORD, 
            {},
            { 
                headers: { 'Content-Type': 'image/jpeg' },
                responseType: 'arraybuffer'
            }
        );

        res.set({
            'Content-Type': 'image/jpeg',
        });

        res.send(Buffer.from(data));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del streaming: ' + error.message);
    }
};

module.exports = {
    validateStreaming
}
