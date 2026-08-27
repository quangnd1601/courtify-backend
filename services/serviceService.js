const Service = require('../models/Service');

const getServicesByCenter = async (sportCenterId) => {
  return await Service.find({ sport_center_id: sportCenterId });
};

const getServiceById = async (id) => {
  return await Service.findById(id);
};

const createService = async (serviceData) => {
  const newService = new Service(serviceData);
  return await newService.save();
};

const updateService = async (id, updateData) => {
  return await Service.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteService = async (id) => {
  return await Service.findByIdAndDelete(id);
};

module.exports = {
  getServicesByCenter,
  getServiceById,
  createService,
  updateService,
  deleteService
};
