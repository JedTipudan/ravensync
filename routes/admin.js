const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers, updateUser, deleteUser, getAuditLogs, createUser, getFilteredWords, addFilteredWord, deleteFilteredWord } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('superadmin', 'admin'));
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.post('/users', authorize('superadmin'), createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/audit-logs', getAuditLogs);

// Word filter — superadmin only
router.get('/word-filter', authorize('superadmin'), getFilteredWords);
router.post('/word-filter', authorize('superadmin'), addFilteredWord);
router.delete('/word-filter/:id', authorize('superadmin'), deleteFilteredWord);

module.exports = router;
