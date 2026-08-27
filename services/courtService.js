const Court = require('../models/Court');
const BookedSlot = require('../models/BookedSlot');
const Booking = require('../models/Booking');

const getAllCourts = async () => {
  return await Court.find()
    .populate({
      path: 'sport_center_id',
      select: 'name address status sport_id',
      populate: {
        path: 'sport_id',
        select: 'name'
      }
    })
    .sort({ created_at: 1 }); // Sân thêm mới hiện SAU CÙNG
};

const getCourtsByCenter = async (centerId) => {
  // Trả về TẤT CẢ sân (cả ACTIVE/MAINTENANCE/INACTIVE)
  // Frontend tự xử lý hiển thị: sân không ACTIVE sẽ bị mờ + không chọn được
  const query = { sport_center_id: centerId };
  return await Court.find(query)
    .populate({
      path: 'sport_center_id',
      select: 'name address status sport_id',
      populate: {
        path: 'sport_id',
        select: 'name'
      }
    })
    .sort({ created_at: 1 }); // Sân thêm mới hiện SAU CÙNG
};

const getCourtById = async (id) => {
  return await Court.findById(id);
};

const createCourt = async (courtData) => {
  const newCourt = new Court(courtData);
  return await newCourt.save();
};

const updateCourt = async (id, updateData) => {
  return await Court.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteCourt = async (id) => {
  // Đếm đơn đặt sân ĐANG HOẠT ĐỘNG (chờ duyệt / đã duyệt / hoàn thành) trỏ tới sân này
  const activeBookings = await Booking.countDocuments({
    'details.court_id': id,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }
  });

  if (activeBookings > 0) {
    const err = new Error(
      `Không thể xóa sân vì còn ${activeBookings} đơn đặt sân đang hoạt động (chờ duyệt/đã duyệt/hoàn thành). Hãy chuyển sân sang trạng thái INACTIVE (tạm đóng) thay vì xóa.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Xoá các BookedSlot (khung giờ đã khoá) của sân này
  await BookedSlot.deleteMany({ court_id: id });

  return await Court.findByIdAndDelete(id);
};

const bulkUpdatePrice = async (centerId, price) => {
  return await Court.updateMany(
    { sport_center_id: centerId },
    { $set: { price_per_hour: price } }
  );
};

module.exports = {
  getAllCourts,
  getCourtsByCenter,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
  bulkUpdatePrice
};
