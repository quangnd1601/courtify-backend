const bookingService = require('../services/bookingService');

const createBooking = async (req, res) => {
  try {
    const savedBooking = await bookingService.createBooking(req.body);

    const message = req.body.payment_method === 'cash'
      ? "Đặt sân thành công! Vui lòng đến thanh toán bằng tiền mặt tại sân."
      : "Đặt sân thành công! Vui lòng thực hiện thanh toán.";

    res.status(201).json({
      success: true,
      message: message,
      data: savedBooking
    });
  } catch (error) {
    // check trùng lịch
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Rất tiếc! Một trong các khung giờ bạn chọn vừa có người đặt mất rồi."
      });
    }
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id; // Từ token
    const bookings = await bookingService.getMyBookings(userId);
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối' });
    }
    const bookings = await bookingService.getAllBookings();
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ADMIN: có thể chuyển mọi trạng thái
    if (req.user.role === 'ADMIN') {
      const updatedBooking = await bookingService.updateBookingStatus(id, status);
      return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: updatedBooking });
    }

    // CUSTOMER: chỉ được phép hủy (CANCELLED) booking của chính mình
    if (status !== 'CANCELLED') {
      return res.status(403).json({ success: false, message: 'Bạn chỉ có thể hủy đơn đặt sân của mình' });
    }

    const userId = req.user.userId || req.user._id;
    const booking = await bookingService.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt sân' });
    }
    if (booking.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn đặt sân này' });
    }
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Đơn đặt sân này không thể hủy' });
    }

    // Chặn khách tự hủy đơn ĐÃ THANH TOÁN (tiền thật đã vào — cần admin xử lý hoàn tiền thủ công)
    const payment = await bookingService.getPaymentByBookingId(id);
    if (payment && payment.payment_status === 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'Đơn này đã thanh toán, bạn không thể tự hủy. Vui lòng liên hệ quản trị viên để được hỗ trợ hủy và hoàn tiền.'
      });
    }

    const updatedBooking = await bookingService.updateBookingStatus(id, 'CANCELLED');
    res.status(200).json({ success: true, message: 'Hủy đặt sân thành công', data: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus
};
