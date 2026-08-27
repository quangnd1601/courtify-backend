const express = require('express');
const router = express.Router();
const sportCenterController = require('../controllers/sportCenterController');

router.get('/', sportCenterController.getAllCenters);
router.get('/:id', sportCenterController.getCenterById);
router.post('/', sportCenterController.createCenter);
router.put('/:id', sportCenterController.updateCenter);
router.delete('/:id', sportCenterController.deleteCenter);

module.exports = router;
