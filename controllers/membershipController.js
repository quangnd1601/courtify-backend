const membershipService = require('../services/membershipService');

const getMembershipTypes = async (req, res) => {
  try {
    const types = await membershipService.getMembershipTypes(req.params.centerId);
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const buyMembership = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id; // Lấy từ token qua authen middleware
    const { membership_type_id } = req.body;
    
    const membership = await membershipService.buyMembership(userId, membership_type_id);
    res.status(201).json({ success: true, message: "Đăng ký Gói Thành Viên thành công", data: membership });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMembershipTypes,
  buyMembership
};
