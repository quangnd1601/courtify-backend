const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authen = require('../middleware/authen');

router.get('/', reviewController.getAllReviews);
router.get('/sport-centers/:centerId', reviewController.getReviewsByCenter);
// Viết đánh giá yêu cầu đăng nhập
router.post('/', authen, reviewController.createReview);

module.exports = router;
