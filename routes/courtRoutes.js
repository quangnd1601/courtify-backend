const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');

router.get('/', courtController.getAllCourts);
router.get('/sport-centers/:centerId', courtController.getCourtsByCenter);
router.get('/:id', courtController.getCourtById);
router.post('/', courtController.createCourt);
router.put('/:id', courtController.updateCourt);
router.delete('/:id', courtController.deleteCourt);
router.put('/sport-centers/:centerId/bulk-price', courtController.bulkUpdatePrice);

module.exports = router;
