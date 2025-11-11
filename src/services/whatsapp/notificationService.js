const whatsappService = require('./whatsappService');

/**
 * Sends a welcome message to a newly created user.
 * @param {object} user - The user object.
 * @param {string} user.name - The user's name.
 * @param {string} user.phone_number - The user's phone number.
 */
const sendWelcomeMessage = async (user) => {
  console.log(`Attempting to send welcome message to ${user.name} at ${user.phone_number}`);
  
  // Check if the WhatsApp client is ready
  const isWhatsAppConnected = whatsappService.getClientStatus();
  if (!isWhatsAppConnected) {
    console.error('[Error] WhatsApp service is not connected. The welcome message will not be sent.');
    return;
  }

  // Craft the personalized welcome message
  const message = `¡Hola ${user.name}! 👋\n\nTe damos la bienvenida a nuestro centro de entrenamiento. ¡Estamos muy emocionados de que te unas a nuestra comunidad!\n\nTu registro se ha completado exitosamente. Ahora eres parte de un lugar donde podrás superar tus límites y alcanzar todas tus metas de acondicionamiento físico.\n\nSi tienes alguna pregunta sobre tus horarios, nuestros entrenadores o las instalaciones, no dudes en responder a este mensaje. Estamos aquí para ayudarte.\n\n¡Prepárate para transformar tu energía! Nos vemos pronto en el entrenamiento. 💪`;

  try {
    // Send the message using the whatsappService
    await whatsappService.sendWhatsAppMessage(user.phone_number, message);
    console.log(`✅ Welcome message sent successfully to ${user.name}.`);
  } catch (error) {
    console.error(`❌ Failed to send welcome message to ${user.name}:`, error);
  }
};



/**
 * NUEVA FUNCIÓN: Envía un mensaje de bienvenida específico para usuarios de "ticketere".
 * @param {object} user - El objeto del usuario del ticket.
 * @param {string} user.name - El nombre del usuario del ticket.
 * @param {string} user.phone_number - El número de teléfono del usuario del ticket.
 */
const sendTicketWelcomeMessage = async (user) => {
    console.log(`Attempting to send ticket welcome message to ${user.name} at ${user.phone_number}`);

    const isWhatsAppConnected = whatsappService.getClientStatus();
    if (!isWhatsAppConnected) {
        console.error('[Error] WhatsApp service is not connected. The ticket welcome message will not be sent.');
        return;
    }

    // El mensaje específico que solicitaste
    const message = `¡Hola ${user.name}! 👋\n\nBienvenido a las clases personalizadas de ticketere. ¡Estamos listos para que empieces a disfrutar!\n\nSi tienes alguna duda, no dudes en contactarnos.`;

    try {
        await whatsappService.sendWhatsAppMessage(user.phone_number, message);
        console.log(`✅ Ticket welcome message sent successfully to ${user.name}.`);
    } catch (error) {
        console.error(`❌ Failed to send ticket welcome message to ${user.name}:`, error);
    }
};

module.exports = {
  sendWelcomeMessage,
  sendTicketWelcomeMessage,
};
