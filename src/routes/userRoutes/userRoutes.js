const express = require('express');
const router = express.Router();

// --- CONTROLADORES DE USUARIO ---
const { 
    getUserCapabilities, 
    addUserInfo, 
    deleteUser, 
    searchUser, 
    updateUserFace, 
    getUserImageAsJPEG, 
    deleteUserImage, 
    updateUserStatus, 
    updateUserAccessesService, 
    updateUserInfo, 
    listAllUsers,
    saveUserDbImage,
    ingresoDiario
} = require('../../controllers/users/user.controller');

// --- CONTROLADOR DE NOTAS ---
const {
    getUserNote,
    createUserNote,
    updateUserNote
} = require('../../controllers/users/notes.controller');

// --- CONTROLADOR DE TIQUETES (CON TODAS LAS FUNCIONES) ---
const { 
    sellTicket, 
    listAllTicketUsers, 
    deleteTicketUser,
    getTicketUser,
    updateTicketUser,
    saveTicketUserFace,
    getAllTicketAccessEvents  // 👈 importar la nueva función

} = require('../../controllers/users/ticket.controller');

// --- CONTROLADOR DE ACCESOS ---
const { recordAccess } = require('../../controllers/users/access.controller');
const { API_URL_REMOTE_DOOR_OPEN } = require('../../../config');

// --- CONTROLADOR DE INFORMES (AÑADIDO) ---
const { 
    getInformes 
} = require('../../controllers/informes/informe.controller'); // Ajusta la ruta


// --- RUTAS PRINCIPALES DE USUARIO ---
router.get('/capabilities', getUserCapabilities);
router.post('/add', addUserInfo);
router.put('/update-user-access', updateUserStatus);
router.put('/delete', deleteUser);
router.post('/search', searchUser);
router.post('/update-face', updateUserFace);
router.put('/delete-face', deleteUserImage);
router.get('/profile-image', getUserImageAsJPEG);
router.put('/update-accesses', updateUserAccessesService);
router.post('/update-user-info', updateUserInfo);
router.get('/listUsers', listAllUsers);
router.post('/save-db-image', saveUserDbImage);

// --- RUTAS PARA GESTIONAR NOTAS ---
router.get('/notes/:employeeNo', getUserNote);
router.post('/notes', createUserNote);
router.put('/notes/:employeeNo', updateUserNote);

// --- RUTAS PARA TIQUETERA Y ACCESOS ---
router.post('/sell-ticket', sellTicket);
router.get('/list-ticket-users', listAllTicketUsers);
router.put('/delete-ticket-user', deleteTicketUser);
router.get('/ticket-user/:employeeNo', getTicketUser);
router.put('/ticket-user/:employeeNo', updateTicketUser);
router.post('/record-access', recordAccess);
router.post('/ticket-user/save-face', saveTicketUserFace);
router.post('/ticketEvents/all', getAllTicketAccessEvents);

// --- RUTA DE INFORMES (AÑADIDA) ---
router.get('/informes', getInformes);
router.post('/ingreso-diario', ingresoDiario); // <-- 2. Añade la nueva ruta

module.exports = router;