const reviewService = require('../services/reviewService');

const getReviewsByCenter = async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsByCenter(req.params.centerId);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.body);
    res.status(201).json({ success: true, message: "Gửi đánh giá thành công", data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getAllReviews();
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReviewsByCenter,
  createReview,
  getAllReviews
};
