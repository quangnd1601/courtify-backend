const jwt = require('jsonwebtoken');

const authen = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server chưa cấu hình JWT_SECRET trong file .env' });
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user;
      return next();
    }
    return res.status(401).json({ error: 'Không tìm thấy Token xác thực' });
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn: ' + error.message });
  }
};

module.exports = authen;
