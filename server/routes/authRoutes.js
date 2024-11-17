//routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const upload = require("../config/multer");
router.post(
  "/register",
  upload.single("facePhoto"),
  authController.registerStudent
);
router.post("/login", authController.loginFaculty);

module.exports = router;
