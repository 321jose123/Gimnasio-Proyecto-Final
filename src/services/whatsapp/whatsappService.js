// --- CORRECCIÓN: Se añade "MessageMedia" a la importación ---
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");

// Global variables to handle connection state
let client;
let clientConnected = false;
let qrCodeUrl = null;

/**
 * Initializes the WhatsApp client, sets up event listeners for QR code,
 * authentication, and disconnection.
 * @returns {Promise<void>} A promise that resolves when the client is ready.
 */
const initialize = () => {
  console.log("Initializing WhatsApp client...");
  return new Promise((resolve, reject) => {
    client = new Client({
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        handleSIGINT: false
      },
      // Uses local session data to avoid re-scanning the QR code on every start
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, "../../../session-data") // Store session in root/session-data
      })
    });

    client.on("ready", async () => {
      console.log("WhatsApp client is ready! ✅");
      clientConnected = true;
      qrCodeUrl = null; // QR code is no longer needed
      resolve();
    });

    client.on("authenticated", () => {
      console.log("WhatsApp session authenticated and saved. 🎉");
      clientConnected = true;
    });

    client.on("qr", (qr) => {
      console.log("QR code generated. Please scan to log in. 📱");
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
        } else {
          qrCodeUrl = url;
        }
      });
    });

    client.on("disconnected", (reason) => {
      console.log("WhatsApp client was disconnected:", reason);
      clientConnected = false;
      qrCodeUrl = null;
      // Attempt to re-initialize to get a new QR code if needed
      initialize().catch(err => console.error("Failed to re-initialize after disconnection:", err));
    });

    client.on('auth_failure', (msg) => {
      console.error('AUTHENTICATION FAILURE:', msg);
      reject(new Error(`Authentication failure: ${msg}`));
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('(SIGINT) Shutting down...');
      if (client) {
        await client.destroy();
        console.log('Client destroyed');
      }
      process.exit(0);
    });

    client.initialize().catch(err => {
        console.error("Failed to initialize client:", err);
        reject(err);
    });
  });
};

/**
 * Formats a phone number to the standard WhatsApp format (e.g., 573001234567).
 * @param {string} phoneNumber - The phone number to format.
 * @returns {string|null} The formatted number or null if invalid.
 */
const formatPhoneNumberForWhatsApp = (phoneNumber) => {
  const cleanedPhone = String(phoneNumber).replace(/\D/g, '');
  if (cleanedPhone.startsWith('57') && cleanedPhone.length === 12) {
    return cleanedPhone;
  }
  if (cleanedPhone.length === 10) {
    return `57${cleanedPhone}`;
  }
  console.warn(`Could not format phone number: ${phoneNumber}. It might be in an international format already.`);
  return cleanedPhone; // Return cleaned number as a fallback
};

/**
 * Sends a message to a given WhatsApp number.
 * @param {string} number - The recipient's phone number.
 * @param {string} message - The message content.
 */
const sendWhatsAppMessage = async (number, message) => {
  if (!clientConnected) {
    console.error("WhatsApp client is not connected. Cannot send message.");
    return;
  }
  const formattedNumber = formatPhoneNumberForWhatsApp(number);
  
  if (formattedNumber) {
    const whatsappId = `${formattedNumber}@c.us`;
    try {
      await client.sendMessage(whatsappId, message);
      console.log(`Message successfully sent to ${formattedNumber}`);
    } catch (error) {
      console.error(`Failed to send message to ${formattedNumber}:`, error);
    }
  } else {
    console.error("Invalid phone number provided:", number);
  }
};


/**
 * NUEVA FUNCIÓN: Envía un mensaje con una imagen adjunta.
 * @param {string} number - El número de teléfono del destinatario.
 * @param {string} caption - El texto que acompañará a la imagen.
 * @param {string} imageBase64 - La imagen codificada en base64.
 */
const sendWhatsAppMedia = async (number, caption, imageBase64) => {
  if (!clientConnected) {
    console.log("El cliente no está listo para enviar mensajes con multimedia.");
    return;
  }
  const formattedNumber = formatPhoneNumberForWhatsApp(number);
  const finalNumber = formattedNumber || number;
  if (finalNumber) {
    try {
      // Ahora "MessageMedia" está definido y este bloque funcionará.
      const media = new MessageMedia('image/jpeg', imageBase64);
      // Enviar la imagen con el texto como pie de foto (caption)
      await client.sendMessage(`${finalNumber}@c.us`, media, { caption: caption });
      console.log(`Mensaje con imagen enviado a ${finalNumber}`);
    } catch (error) {
      console.error("Error al enviar mensaje con imagen:", error);
    }
  } else {
    console.error("Número inválido para envío de media:", number);
  }
};


/**
 * Crea un nuevo usuario de ticket y envía un mensaje de bienvenida.
 * Esta función es solo un DEF de ejemplo, integra la lógica en tu endpoint real.
 * Por ejemplo, si tienes un endpoint POST /api/tickets/create-user
 */
const saveticket_user = async (req, res) => {
    try {
        const { employeeNo, name, phoneNumber } = req.body; // Ajusta los campos según lo que recibas

        // 1. Validar datos de entrada
        if (!employeeNo || !name || !phoneNumber) {
            return res.status(400).json({ message: 'employeeNo, name y phoneNumber son obligatorios.' });
        }

        // 2. Crear el usuario en tu base de datos (usando tu modelo TicketUserModel)
        const newTicketUser = await TicketUserModel.createTicketUser({
            employee_no: employeeNo,
            name: name,
            phone_number: phoneNumber,
            // ... otros campos relevantes para ticket_user
        });

        if (!newTicketUser) {
            return res.status(500).json({ message: 'No se pudo crear el usuario del ticket.' });
        }

        // 3. Enviar el mensaje de bienvenida de Ticketere
        notificationService.sendTicketWelcomeMessage({
            name: newTicketUser.name, // O name del req.body si el modelo no lo devuelve
            phone_number: newTicketUser.phone_number // O phoneNumber del req.body
        }).catch(err => {
            console.error("Error al enviar el mensaje de bienvenida de Ticketere por WhatsApp:", err);
            // Decide si esto debe bloquear la respuesta de la API o solo registrarse
        });

        // 4. Responder al cliente
        res.status(201).json({
            message: 'Usuario de ticket creado exitosamente y mensaje de bienvenida enviado.',
            data: newTicketUser
        });

    } catch (error) {
        console.error('Error al crear el usuario del ticket:', error);
        res.status(500).json({
            message: 'Error interno del servidor al crear el usuario del ticket.',
            error: error.message,
        });
    }
};



/**
 * Returns the current QR code as a Data URL.
 * @returns {string|null}
 */
const getQrCodeUrl = () => qrCodeUrl;

/**
 * Returns the connection status of the client.
 * @returns {boolean}
 */
const getClientStatus = () => clientConnected;

module.exports = {
  saveticket_user,
  initialize,
  sendWhatsAppMessage,
  getQrCodeUrl,
  getClientStatus,
  sendWhatsAppMedia
};

