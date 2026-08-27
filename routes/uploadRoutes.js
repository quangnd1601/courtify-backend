const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary } = require('../middleware/uploadMiddleware');

// POST /api/upload/single - Upload 1 ảnh đại diện/thumbnail
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn 1 file ảnh' });
    }
    const folder = req.body.folder || 'courtify/general';
    const imageUrl = await uploadToCloudinary(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      message: 'Upload ảnh thành công',
      url: imageUrl,
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi upload Cloudinary' });
  }
});

// POST /api/upload/multiple - Upload nhiều ảnh 
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 file ảnh' });
    }
    const folder = req.body.folder || 'courtify/sport_centers';

    // Upload song song các file bằng Promise.all
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, folder));
    const imageUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `Upload thành công ${imageUrls.length} ảnh`,
      urls: imageUrls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
