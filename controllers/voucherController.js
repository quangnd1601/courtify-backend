const voucherService = require('../services/voucherService');

const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await voucherService.getAllVouchers();
    res.status(200).json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVoucherById = async (req, res) => {
  try {
    const voucher = await voucherService.getVoucherById(req.params.id);
    if (!voucher) return res.status(404).json({ success: false, message: "Không tìm thấy voucher" });
    res.status(200).json({ success: true, data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createVoucher = async (req, res) => {
  try {
    const voucher = await voucherService.createVoucher(req.body);
    res.status(201).json({ success: true, message: "Thêm Voucher thành công", data: voucher });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateVoucher = async (req, res) => {
  try {
    const updatedVoucher = await voucherService.updateVoucher(req.params.id, req.body);
    if (!updatedVoucher) return res.status(404).json({ success: false, message: "Không tìm thấy voucher" });
    res.status(200).json({ success: true, message: "Cập nhật thành công", data: updatedVoucher });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    const deletedVoucher = await voucherService.deleteVoucher(req.params.id);
    if (!deletedVoucher) return res.status(404).json({ success: false, message: "Không tìm thấy voucher" });
    res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkVoucher = async (req, res) => {
  try {
    const voucher = await voucherService.getVoucherByCode(req.params.code);
    const now = new Date();
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher không tồn tại hoặc đã hết hạn" });
    }
    if (now < new Date(voucher.start_date) || now > new Date(voucher.end_date)) {
      return res.status(400).json({ success: false, message: "Voucher đã hết hạn sử dụng" });
    }
    if (voucher.usage_limit != null && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: "Voucher đã hết lượt sử dụng" });
    }
    res.status(200).json({ success: true, data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  checkVoucher
};
