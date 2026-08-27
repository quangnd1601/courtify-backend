const Review = require('../models/Review');
const SportCenter = require('../models/SportCenter');

const getReviewsByCenter = async (centerId) => {
  return await Review.find({ sport_center_id: centerId }).populate('user_id', 'name avatar_url');
};

const createReview = async (reviewData) => {
  const newReview = new Review(reviewData);
  const savedReview = await newReview.save();

  // Tính lại điểm trung bình và tổng số review của trung tâm thể thao
  const reviews = await Review.find({ sport_center_id: reviewData.sport_center_id });
  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  await SportCenter.findByIdAndUpdate(reviewData.sport_center_id, {
    average_rating: avgRating,
    total_reviews: totalReviews
  });

  return savedReview;
};

const getAllReviews = async () => {
  return await Review.find()
    .sort({ created_at: -1 })
    .populate('user_id', 'name avatar_url')
    .populate('sport_center_id', 'name');
};

module.exports = {
  getReviewsByCenter,
  createReview,
  getAllReviews
};
