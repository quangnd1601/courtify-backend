const SportCenter = require('../models/SportCenter');
const Sport = require('../models/Sport');
const Voucher = require('../models/Voucher');

const getHomeServices = async (limits = {}) => {
  const popularLimit = Number(limits.popularLimit || 4);
  const mostViewedLimit = Number(limits.mostViewedLimit || 4);
  const categoryLimit = Number(limits.categoryLimit || 6);
  const voucherLimit = Number(limits.voucherLimit || 4);

  const [popularCenters, mostViewedCenters, categories, vouchers] = await Promise.all([
    // 1. Sản phẩm/Cụm sân phổ biến (Được đặt nhiều nhất, sắp xếp giảm dần)
    SportCenter.find({ status: 'ACTIVE' })
      .populate('sport_id', 'name')
      .sort({ total_bookings: -1, created_at: -1 })
      .limit(popularLimit),

    // 2. Sản phẩm/Cụm sân xem nhiều nhất (Sắp xếp lượt xem giảm dần)
    SportCenter.find({ status: 'ACTIVE' })
      .populate('sport_id', 'name')
      .sort({ total_views: -1, created_at: -1 })
      .limit(mostViewedLimit),

    // Danh mục môn thể thao
    Sport.find({}).limit(categoryLimit),

    // Voucher ưu đãi
    Voucher.find({
      status: 'ACTIVE',
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
      $expr: { $lt: ['$used_count', '$usage_limit'] }
    })
      .sort({ created_at: -1 })
      .limit(voucherLimit)
  ]);

  return {
    popularCenters,
    mostViewedCenters,
    categories,
    vouchers
  };
};

module.exports = {
  getHomeServices
};

