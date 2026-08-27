const homeService = require('../services/homeService');

const getHomeData = async (req, res) => {
  try {
    const limits = {
      popularLimit: Number(req.query.popularLimit || 4),
      mostViewedLimit: Number(req.query.mostViewedLimit || 4),
      categoryLimit: Number(req.query.categoryLimit || 6),
      voucherLimit: Number(req.query.voucherLimit || 4)
    };
    const data = await homeService.getHomeServices(limits);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHomeData
};
