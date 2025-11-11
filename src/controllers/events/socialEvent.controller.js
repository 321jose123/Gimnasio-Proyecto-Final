const userModel = require('../../models/users/users.models');
const whatsappService = require('../../services/whatsapp/whatsappService');

/**
 * Inicia una difusión de un mensaje y/o imagen a todos los usuarios activos con número de teléfono.
 * Responde inmediatamente y procesa los envíos en segundo plano.
 */
const broadcastEvent = async (req, res) => {
  const { message, imageBase64 } = req.body;

  // 1. Validar que el mensaje exista
  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'El mensaje es obligatorio.' });
  }

  // 2. Validar que el servicio de WhatsApp esté conectado (¡CRÍTICO!)
  if (!whatsappService.getClientStatus()) {
    console.error('[Broadcast] Intento de difusión fallido: El servicio de WhatsApp no está conectado.');
    return res.status(503).json({ success: false, message: 'El servicio de WhatsApp no está conectado. No se puede iniciar la difusión.' });
  }

  // 3. Enviar una respuesta inmediata al frontend
  res.status(202).json({ 
    success: true, 
    message: 'Difusión iniciada. Los mensajes se están enviando en segundo plano.' 
  });

  // 4. Ejecutar el proceso de envío masivo en segundo plano
  (async () => {
    console.log('--- [Broadcast] INICIANDO PROCESO DE ENVÍO EN SEGUNDO PLANO ---');
    try {
      const users = await userModel.getAllActiveUsersWithPhone();
      console.log(`[Broadcast] Se encontraron ${users.length} usuarios activos con número de teléfono.`);

      if (users.length === 0) {
        console.warn('[Broadcast] No se encontraron usuarios para la difusión. Proceso finalizado.');
        return;
      }

      for (const [index, user] of users.entries()) {
        // --- INICIO DEL BLOQUE TRY...CATCH INDIVIDUAL ---
        try {
          if (!user.phone_number) {
              console.warn(`[Broadcast] [${index + 1}/${users.length}] Saltando usuario ${user.name} por no tener número de teléfono.`);
              continue; // Salta a la siguiente iteración del bucle
          }

          const personalizedMessage = message.replace(/{name}/g, user.name);
          
          console.log(`[Broadcast] [${index + 1}/${users.length}] Preparando envío para: ${user.name} (${user.phone_number})`);

          if (imageBase64) {
            console.log(`[Broadcast] -> Enviando con imagen...`);
            await whatsappService.sendWhatsAppMedia(user.phone_number, personalizedMessage, imageBase64);
          } else {
            console.log(`[Broadcast] -> Enviando solo texto...`);
            await whatsappService.sendWhatsAppMessage(user.phone_number, personalizedMessage);
          }

        } catch (individualError) {
          // Si un solo mensaje falla, lo registramos y continuamos con el siguiente
          console.error(`[Broadcast] Error al enviar al usuario ${user.name} (${user.phone_number}). Continuando con el siguiente. Error:`, individualError.message);
        }
        // --- FIN DEL BLOQUE TRY...CATCH INDIVIDUAL ---

        // Pausa para evitar ser bloqueado por WhatsApp
        await new Promise(resolve => setTimeout(resolve, 2500)); // Pausa de 2.5 segundos
      }
      console.log('--- [Broadcast] DIFUSIÓN FINALIZADA ---');
    } catch (error) {
      // Este error solo se activará si falla la consulta a la base de datos
      console.error('--- [Broadcast] ERROR FATAL DURANTE LA OBTENCIÓN DE USUARIOS ---', error);
    }
  })();
};

module.exports = {
  broadcastEvent,
};

