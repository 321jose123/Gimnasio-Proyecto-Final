const path = require('path');
const showInputStreaming = async (req, res) => {
    res.sendFile(path.join(__dirname, '../../assets/pages/index.html'));
}

module.exports = { showInputStreaming }