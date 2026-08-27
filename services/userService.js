const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getAll = async () => {
  return await User.find({});
};

const getOne = async (id) => {
  return await User.findById(id);
};

const update = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true });
};

const lock = async (id) => {
  return await User.findByIdAndUpdate(id, { status: 'BANNED' }, { new: true });
};

const unlock = async (id) => {
  return await User.findByIdAndUpdate(id, { status: 'ACTIVE' }, { new: true });
};

const register = async (userData) => {
  const { name, email, password, confirm_password, phone, avatar } = userData;

  if (!name || !email || !password || !confirm_password) {
    throw new Error('Vui lòng nhập đầy đủ thông tin');
  }
  if (password !== confirm_password) {
    throw new Error('Mật khẩu và xác nhận mật khẩu không trùng khớp');
  }

  const existingUsers = await getAll();
  const emailExists = existingUsers.find((u) => u.email === email);
  if (emailExists) {
    throw new Error('Email đã tồn tại');
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const newUser = new User({
    name,
    email,
    password: hash,
    phone,
    avatar_url: avatar,
    role: 'CUSTOMER'
  });

  return await newUser.save();
};

const login = async (email, password) => {
  const user = await User.findOne({ email: email });
  if (user && bcrypt.compareSync(password, user.password)) {
    // Chặn ngay nếu tài khoản đã bị khóa
    if (user.status === 'BANNED') {
      throw new Error('Tài khoản của bạn đã bị khóa');
    }

    const access_token = jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: 15 * 60,
    });
    const refresh_token = jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: 30 * 60,
    });
    return { user, access_token, refresh_token };
  } else {
    throw new Error('Sai email hoặc mật khẩu');
  }
};

const refreshAccessToken = async (refreshToken) => {
  const data = jwt.verify(refreshToken, process.env.JWT_SECRET);
  const access_token = jwt.sign({ user: data.user }, process.env.JWT_SECRET, {
    expiresIn: 1 * 60,
  });
  const new_refresh_token = jwt.sign({ user: data.user }, process.env.JWT_SECRET, {
    expiresIn: 2 * 60,
  });
  return { user: data.user, access_token, refresh_token: new_refresh_token };
};

const getUserProfile = async (userId) => {
  return await User.findById(userId).select('-password');
};

module.exports = {
  getAll,
  getOne,
  update,
  lock,
  unlock,
  register,
  login,
  refreshAccessToken,
  getUserProfile
};
