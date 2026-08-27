const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authen = require('../middleware/authen');

router.get('/', userController.getAllUsers);
router.get('/profile', authen, userController.getProfile);
router.get('/:id', userController.getUserById);
router.put('/:id', authen, userController.updateUser);
router.put('/:id/lock', userController.lockUser);
router.put('/:id/unlock', userController.unlockUser);

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

module.exports = router;
