const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  sport_center_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SportCenter', required: true },
  service_name: { type: String, required: true }, // e.g., 'Nước suối', 'Thuê vợt'
  price: { type: Number, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  description: { type: String },
  image_url: { type: String }
});

module.exports = mongoose.model('Service', serviceSchema);
