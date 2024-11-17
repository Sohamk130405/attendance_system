// config/multer.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, file.fieldname + "-" + Date.now() + ext); // Append extension to filename
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
