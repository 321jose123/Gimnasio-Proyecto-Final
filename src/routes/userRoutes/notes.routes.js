const express = require('express');
const router = express.Router();
const { 
    getUserNote, 
    createUserNote, 
    updateUserNote 
} = require('../../controllers/users/notes.controller');

// --- RUTAS PARA GESTIONAR NOTAS DE USUARIOS ---

// GET -> Obtener la nota de un usuario por su ID
// Ejemplo de uso: GET http://localhost:3000/api/notes/1005163055
router.get('/:employeeNo', getUserNote);

// POST -> Crear una nueva nota para un usuario
// Ejemplo de uso: POST http://localhost:3000/api/notes
// Body: { "employeeNo": "1005163055", "nota": "Este es un nuevo comentario." }
router.post('/', createUserNote);

// PUT -> Actualizar la nota de un usuario existente
// Ejemplo de uso: PUT http://localhost:3000/api/notes/1005163055
// Body: { "nota": "Este es el comentario actualizado." }
router.put('/:employeeNo', updateUserNote);


module.exports = router;
