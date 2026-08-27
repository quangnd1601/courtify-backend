const mongoose = require('mongoose');

const userMembershipSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membership_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipType', required: true },
  
  bought_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  
  price_at_purchase: { type: Number, required: true },
  discount_rate_at_purchase: { type: Number, required: true },
  
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' }
});

module.exports = mongoose.model('UserMembership', userMembershipSchema);
