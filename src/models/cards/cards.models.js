const { client } = require("../../db/databasepg");

/**
 * Guarda o actualiza una tarjeta asignada a un usuario en la base de datos.
 */
const saveCardToUser = async (employeeNo, cardNo, deleteCard, cardType, checkCardNo, checkEmployeeNo, addCard) => {
  const query = `
    INSERT INTO public.user_cards (
      employee_no, card_no, delete_card, card_type,
      check_card_no, check_employee_no, add_card
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (employee_no) 
    DO UPDATE 
    SET card_no = EXCLUDED.card_no,
        delete_card = EXCLUDED.delete_card,
        card_type = EXCLUDED.card_type,
        check_card_no = EXCLUDED.check_card_no,
        check_employee_no = EXCLUDED.check_employee_no,
        add_card = EXCLUDED.add_card
    RETURNING *;
  `;
  const values = [employeeNo, cardNo, deleteCard, cardType, checkCardNo, checkEmployeeNo, addCard, accesosDisponibles];
  try {
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.log("Error: " + error.message);    
    throw new Error('Error al guardar la tarjeta del usuario');
  }
};

/**
 * Consulta si existe una tarjeta asignada a un usuario.
 */
const getCardFromUser = async (employeeNo) => {
  const query = `
    SELECT * FROM public.user_cards
    WHERE employee_no = $1;
  `;
  const values = [employeeNo];

  try {
    const result = await client.query(query, values);
    return result.rows;
  } catch (error) {
    throw new Error('Error al obtener las tarjetas del usuario');
  }
};

/**
 * Elimina la tarjeta asignada a un usuario.
 */
const deleteCardFromUser = async (employeeNo, cardNo) => {
  const query = `
    DELETE FROM public.user_cards
    WHERE employee_no = $1 AND card_no = $2
    RETURNING *;
  `;
  const values = [employeeNo, cardNo];

  try {
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error('Error al eliminar la tarjeta del usuario');
  }
};

module.exports = {
  saveCardToUser,
  getCardFromUser,
  deleteCardFromUser
};
