const whatsappService = require('../../services/whatsapp/whatsappService');

/**
 * Gets the current WhatsApp connection status.
 */
const getStatus = (req, res) => {
    try {
        const isConnected = whatsappService.getClientStatus();
        if (isConnected) {
            res.status(200).json({ status: 'success', connected: true, message: 'El cliente de WhatsApp está conectado y listo.' });
        } else {
            res.status(200).json({ status: 'pending', connected: false, message: 'El cliente de WhatsApp no está conectado. Genera un QR para escanear.' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error al obtener el estado del cliente de WhatsApp.' });
    }
};

/**
 * Gets the QR code for authentication if available.
 */
const getQrCode = (req, res) => {
    try {
        const qrUrl = whatsappService.getQrCodeUrl();
        const isConnected = whatsappService.getClientStatus();

        if (isConnected) {
             return res.status(200).json({ status: 'success', message: 'El cliente ya está conectado. No se necesita QR.', qrUrl: null });
        }

        if (qrUrl) {
            res.status(200).json({ status: 'pending', message: 'Escanea este código QR para iniciar sesión.', qrUrl: qrUrl });
        } else {
            res.status(200).json({ status: 'initializing', message: 'El código QR está siendo generado. Por favor, espera unos segundos y vuelve a intentarlo.', qrUrl: null });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error al obtener el código QR.' });
    }
};






module.exports = {
    getStatus,
    getQrCode,
};
