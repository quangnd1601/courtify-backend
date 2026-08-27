const sportService = require('../services/sportService');

const getAllSports = async (req, res) => {
  try {
    const sports = await sportService.getAllSports();
    res.status(200).json({ success: true, data: sports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSportById = async (req, res) => {
  try {
    const sport = await sportService.getSportById(req.params.id);
    if (!sport) return res.status(404).json({ success: false, message: 'Không tìm thấy môn thể thao' });
    res.status(200).json({ success: true, data: sport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSport = async (req, res) => {
  try {
    const newSport = await sportService.createSport(req.body);
    res.status(201).json({ success: true, data: newSport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSport = async (req, res) => {
  try {
    const updated = await sportService.updateSport(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy môn thể thao' });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSport = async (req, res) => {
  try {
    const { id } = req.params;
    await sportService.deleteSport(id);
    res.status(200).json({ success: true, message: "Xóa môn thể thao thành công" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport
};
