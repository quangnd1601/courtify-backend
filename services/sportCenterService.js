const SportCenter = require('../models/SportCenter');
const Court = require('../models/Court');
const BookedSlot = require('../models/BookedSlot');
const Service = require('../models/Service');
const MembershipType = require('../models/MembershipType');
const Booking = require('../models/Booking');

const getAllCenters = async (filters = {}) => {
  const query = {};

  // Search by name or address
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    query.$or = [{ name: regex }, { address: regex }];
  }

  // Filter by sport
  if (filters.sport_id) {
    query.sport_id = filters.sport_id;
  }

  // Filter by price range
  if (filters.min_price) {
    query.default_price = { ...query.default_price, $gte: Number(filters.min_price) };
  }
  if (filters.max_price) {
    query.default_price = { ...query.default_price, $lte: Number(filters.max_price) };
  }

  // Filter by minimum rating
  if (filters.min_rating) {
    query.average_rating = { $gte: Number(filters.min_rating) };
  }

  // Status filter (nếu không có thì lấy tất cả trừ khi chỉ định)
  if (filters.status) {
    query.status = filters.status;
  }


  // Sort
  let sortOption = {};
  switch (filters.sort) {
    case 'price_asc':
      sortOption = { default_price: 1 };
      break;
    case 'price_desc':
      sortOption = { default_price: -1 };
      break;
    case 'rating_desc':
      sortOption = { average_rating: -1 };
      break;
    case 'bookings_desc':
      sortOption = { total_bookings: -1 };
      break;
    case 'newest':
      sortOption = { created_at: -1 };
      break;
    default:
      sortOption = { total_bookings: -1 }; // Default: phổ biến nhất
  }

  return await SportCenter.find(query)
    .populate('owner_id', 'name email phone')
    .populate('sport_id', 'name')
    .sort(sortOption);
};

const getCenterById = async (id) => {
  return await SportCenter.findById(id).populate('owner_id', 'name email phone').populate('sport_id', 'name');
};

const createCenter = async (centerData) => {
  const newCenter = new SportCenter(centerData);
  return await newCenter.save();
};

const updateCenter = async (id, updateData) => {
  return await SportCenter.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteCenter = async (id) => {
  // Lấy tất cả sân thuộc cụm
  const courts = await Court.find({ sport_center_id: id });
  const courtIds = courts.map(c => c._id);

  // Đếm đơn đặt sân ĐANG HOẠT ĐỘNG (chờ duyệt / đã duyệt / hoàn thành) trỏ tới các sân của cụm
  const activeBookings = await Booking.countDocuments({
    'details.court_id': { $in: courtIds },
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }
  });

  if (activeBookings > 0) {
    const err = new Error(
      `Không thể xóa cụm sân vì còn ${activeBookings} đơn đặt sân đang hoạt động (chờ duyệt/đã duyệt/hoàn thành). Hãy chuyển cụm sân sang trạng thái INACTIVE (tạm đóng) thay vì xóa.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Xoá cascade các dữ liệu con để không bị "mồ côi"
  if (courtIds.length > 0) {
    await BookedSlot.deleteMany({ court_id: { $in: courtIds } });
  }
  await Court.deleteMany({ sport_center_id: id });
  await Service.deleteMany({ sport_center_id: id });
  await MembershipType.deleteMany({ sport_center_id: id });

  return await SportCenter.findByIdAndDelete(id);
};

module.exports = {
  getAllCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter
};
