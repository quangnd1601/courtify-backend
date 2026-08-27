const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const authen = require('../middleware/authen');

router.get('/sport-centers/:centerId', membershipController.getMembershipTypes);
router.post('/buy', authen, membershipController.buyMembership);

module.exports = router;
