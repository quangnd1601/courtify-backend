const MembershipType = require('../models/MembershipType');
const UserMembership = require('../models/UserMembership');

const getMembershipTypes = async (centerId) => {
  return await MembershipType.find({ sport_center_id: centerId, status: 'ACTIVE' });
};

const buyMembership = async (userId, membershipTypeId) => {
  const type = await MembershipType.findById(membershipTypeId);
  if (!type) throw new Error('Gói thành viên không tồn tại');

  // Tính ngày hết hạn
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + type.duration_days);

  const newMembership = new UserMembership({
    user_id: userId,
    membership_type_id: membershipTypeId,
    expires_at: expiresAt,
    price_at_purchase: type.price,
    discount_rate_at_purchase: type.discount_rate,
    status: 'ACTIVE'
  });

  return await newMembership.save();
};

module.exports = {
  getMembershipTypes,
  buyMembership
};
