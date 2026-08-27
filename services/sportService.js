const Sport = require('../models/Sport');
const SportCenter = require('../models/SportCenter');

const getAllSports = async () => {
  return await Sport.find({});
};

const getSportById = async (id) => {
  return await Sport.findById(id);
};

const createSport = async (sportData) => {
  const sport = new Sport(sportData);
  return await sport.save();
};

const updateSport = async (id, updateData) => {
  return await Sport.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteSport = async (sportId) => {
  const centerExists = await SportCenter.exists({ sport_id: sportId });
  if (centerExists) {
    throw new Error('Không thể xóa môn thể thao này vì đang có Cụm sân đăng ký hoạt động!');
  }
  return await Sport.findByIdAndDelete(sportId);
};

module.exports = {
  getAllSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport
};
