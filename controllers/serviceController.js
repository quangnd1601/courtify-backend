const serviceService = require('../services/serviceService');

const getServicesByCenter = async (req, res) => {
  try {
    const services = await serviceService.getServicesByCenter(req.params.centerId);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const updated = await serviceService.updateService(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const deleted = await serviceService.deleteService(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
    res.status(200).json({ success: true, message: 'Xóa dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServicesByCenter,
  getServiceById,
  createService,
  updateService,
  deleteService
};
