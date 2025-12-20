const express = require('express');
const router = express.Router();
const { getUserById, updateUser, deleteUser, listUsers } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, requireRole(['ADMIN']), listUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteUser);

module.exports = router;

