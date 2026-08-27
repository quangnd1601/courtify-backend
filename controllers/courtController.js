const courtService = require('../services/courtService');

const getAllCourts = async (req, res) => {
  try {
    const courts = await courtService.getAllCourts();
    res.status(200).json({ success: true, data: courts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourtsByCenter = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const courts = await courtService.getCourtsByCenter(req.params.centerId, includeInactive);
    res.status(200).json({ success: true, data: courts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourtById = async (req, res) => {
  try {
    const court = await courtService.getCourtById(req.params.id);
    if (!court) return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
    res.status(200).json({ success: true, data: court });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCourt = async (req, res) => {
  try {
    const newCourt = await courtService.createCourt(req.body);
    res.status(201).json({ success: true, data: newCourt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCourt = async (req, res) => {
  try {
    const updated = await courtService.updateCourt(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCourt = async (req, res) => {
  try {
    const deleted = await courtService.deleteCourt(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
    res.status(200).json({ success: true, message: 'Xóa sân thành công' });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const bulkUpdatePrice = async (req, res) => {
  try {
    const { price } = req.body;
    await courtService.bulkUpdatePrice(req.params.centerId, price);
    res.status(200).json({ success: true, message: "Cập nhật giá hàng loạt thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
