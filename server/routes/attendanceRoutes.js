const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const upload = require("../config/multer");
router.get("/:sessionId", attendanceController.getAttendance);
router.post("/create-session", attendanceController.createSession);
router.post(
  "/mark-attendance",
  upload.single("facePhoto"),
  attendanceController.markAttendance
);
router.put("/:sessionId/:studentId", attendanceController.toggleAttendance);

module.exports = router;
