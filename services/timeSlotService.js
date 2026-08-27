const TimeSlot = require('../models/TimeSlot');

const getAllTimeSlots = async () => {
  return await TimeSlot.find().sort({ start_time: 1 }); // Sắp xếp theo giờ tăng dần
};

const getTimeSlotById = async (id) => {
  return await TimeSlot.findById(id);
};

const createTimeSlot = async (slotData) => {
  const newSlot = new TimeSlot(slotData);
  return await newSlot.save();
};

const updateTimeSlot = async (id, slotData) => {
  return await TimeSlot.findByIdAndUpdate(id, slotData, { new: true });
};

const deleteTimeSlot = async (id) => {
  return await TimeSlot.findByIdAndDelete(id);
};

const BookedSlot = require('../models/BookedSlot');

const getBookedSlots = async (date, courtIds = []) => {
  const query = {
    booking_for_date: date,
    status: { $in: ['PENDING', 'CONFIRMED'] }
  };
  if (courtIds && courtIds.length > 0) {
    query.court_id = { $in: courtIds };
  }
  return await BookedSlot.find(query);
};

module.exports = {
  getAllTimeSlots,
  getTimeSlotById,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  getBookedSlots
};
