const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authen = require('../middleware/authen');

// Admin: yêu cầu đăng nhập để xem danh sách/khóa/mở khóa người dùng
router.get('/', authen, userController.getAllUsers);
router.get('/profile', authen, userController.getProfile);
router.get('/:id', authen, userController.getUserById);
router.put('/:id', authen, userController.updateUser);
router.put('/:id/lock', authen, userController.lockUser);
router.put('/:id/unlock', authen, userController.unlockUser);

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

module.exports = router;
