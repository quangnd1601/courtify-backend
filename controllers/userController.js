const UserService = require('../services/userService');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res, next) => {
  try {
    // Chỉ ADMIN mới xem được danh sách người dùng
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
    }
    const users = await UserService.getAll();
    res.status(200).json({ users: users });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const user = await UserService.getOne(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    user.password = undefined; // KHÔNG trả password ra ngoài API
    res.status(200).json({ user: user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Kiểm tra quyền: chỉ user sở hữu hoặc ADMIN mới được sửa
    const currentUserId = (req.user && (req.user._id || req.user.userId))?.toString();
    const isAdmin = req.user && req.user.role === 'ADMIN';
    if (!isAdmin && currentUserId !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật thông tin người khác" });
    }

    const { email, password, current_password, name, phone, avatar } = req.body;

    // Nếu đổi mật khẩu thì phải xác nhận mật khẩu hiện tại
    if (password) {
      if (!current_password) {
        return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại" });
      }
      const existingUser = await UserService.getOne(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      const isMatch = bcrypt.compareSync(current_password, existingUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
      }
    }

    if (email) {
      const existingUsers = await UserService.getAll();
      const emailExists = existingUsers.find(
        (u) => u.email === email && u._id.toString() !== userId,
      );
      if (emailExists) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar_url = avatar;
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      updateData.password = bcrypt.hashSync(password, salt);
    }

    const user = await UserService.update(userId, updateData);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Không trả về password
    user.password = undefined;
    res.status(200).json({ success: true, message: "Cập nhật thông tin thành công", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const lockUser = async (req, res, next) => {
  try {
    // Chỉ ADMIN mới khóa được người dùng
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
    }
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const user = await UserService.lock(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    user.password = undefined; // KHÔNG trả password ra ngoài API
    res.status(200).json({ success: true, message: "Khóa người dùng thành công", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const unlockUser = async (req, res, next) => {
  try {
    // Chỉ ADMIN mới mở khóa được người dùng
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
    }
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const user = await UserService.unlock(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    user.password = undefined; // KHÔNG trả password ra ngoài API
    res.status(200).json({ success: true, message: "Mở khóa người dùng thành công", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const register = async (req, res, next) => {
  try {
    const user = await UserService.register(req.body);
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    if (error.message === 'Vui lòng nhập đầy đủ thông tin' ||
      error.message === 'Mật khẩu và xác nhận mật khẩu không trùng khớp' ||
      error.message === 'Email đã tồn tại') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, access_token, refresh_token } = await UserService.login(email, password);
    res.status(200).json({ user, access_token, refresh_token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const result = await UserService.refreshAccessToken(refresh_token);
    res.status(200).json(result);
  } catch (error) {
    res.status(414).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await UserService.getUserProfile(userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  lockUser,
  unlockUser,
  register,
  login,
  refreshToken,
  getProfile
};
