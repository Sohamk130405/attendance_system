// controllers/authController.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { exec } = require("child_process");
const FormData = require("form-data");
const https = require("https");

// Function to extract IPv4 address if the provided address is in IPv4-mapped IPv6 format
const extractIPv4 = (ip) => {
  if (ip.startsWith("::ffff:")) {
    return ip.split("::ffff:")[1]; // Extract the IPv4 part
  }
  return ip;
};

// Function to get MAC address
const getMacAddress = (ip) => {
  return new Promise((resolve, reject) => {
    const ipv4Address = extractIPv4(ip);

    exec(`arp -a ${ipv4Address}`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        const match = stdout.match(/([a-f0-9]{2}[:|\-]?){6}/i);
        if (match) {
          resolve(match[0]);
        } else {
          reject(new Error("MAC address not found"));
        }
      }
    });
  });
};

// Faculty Login
exports.loginFaculty = (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM faculty WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error logging in.", error: err.message });
    }
    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    res.status(200).json({ message: "Login successful.", faculty: result[0] });
  });
};

exports.registerStudent = async (req, res) => {
  let { name, prn, rollNo, branch, division } = req.body;
  const facePhoto = req.file; // Make sure you're using multer for file handling

  if (!(name && prn && rollNo && branch && division && facePhoto)) {
    return res
      .status(400)
      .json({ message: "Null fields or missing face photo." });
  }

  const clientIp =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    const macAddress = await getMacAddress(clientIp); // Await the promise

    // Register face using your Python Face Recognition API
    const faceId = await getFaceId(facePhoto, prn); // Custom function to interact with Python API

    const sql =
      "INSERT INTO students (name, prn, roll_no, branch, division, mac_address, face_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [name, prn, rollNo, branch, division, macAddress, JSON.stringify(faceId)],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Error registering student.",
            error: err.message,
          });
        }
        res.status(201).json({ message: "Student registered successfully." });
      }
    );
  } catch (err) {
    return res.status(500).json({
      message: "Error during registration.",
      error: err.message,
    });
  }
};

// Helper function to register face using Python API
const getFaceId = async (facePhoto, prn) => {
  try {
    let formData = new FormData();
    formData.append("face_photo", fs.createReadStream(facePhoto.path)); // Ensure the image is read from the file system
    formData.append("prn", prn);

    // Assuming your Flask API is running locally on port 8080
    const response = await axios.post(
      "http://192.168.9.14:8080/generate_faceid",
      formData,
      {
        headers: formData.getHeaders(), // Set headers for multipart/form-data
      }
    );

    // Assuming the Flask API returns the PRN or face ID
    return response.data.faceId;
  } catch (error) {
    console.error(
      "Face registration error:",
      error.response?.data || error.message
    );
    throw new Error("Face registration failed");
  } finally {
    // Remove the uploaded file from the file system
    fs.unlink(facePhoto.path, (err) => {
      if (err) {
        console.error("Error removing file:", err.message);
      } else {
        console.log("File successfully removed:", facePhoto.path);
      }
    });
  }
};
