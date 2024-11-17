const { exec } = require("child_process");
const db = require("../config/db");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
// Helper function to extract subnet from IP address
const getSubnet = (ip) => {
  const ipParts = ip.split(".");
  return ipParts.slice(0, 3).join("."); // Returns the first three octets, e.g., "192.168.236"
};

// Helper function to extract IPv4 from IPv6-mapped IPv4
const extractIPv4 = (ip) => {
  return ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;
};

// Function to get MAC address from IP
const getMacAddress = (ip, callback) => {
  const ipv4Address = extractIPv4(ip);
  exec(`arp -a ${ipv4Address}`, (err, stdout, stderr) => {
    if (err) {
      callback(err, null);
    } else {
      const match = stdout.match(/([a-f0-9]{2}[:|\-]?){6}/i);
      console.log(match[0]);
      if (match) {
        callback(null, match[0]);
      } else {
        callback(new Error("MAC address not found"), null);
      }
    }
  });
};

// Create Attendance Session
exports.createSession = (req, res) => {
  const { facultyId, subject, branch, division } = req.body;
  const facultyIp = extractIPv4(req.ip); // Handle IPv6-mapped IPv4 addresses

  const sql =
    "INSERT INTO sessions (faculty_id, subject, branch, division, faculty_ip) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [facultyId, subject, branch, division, facultyIp],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error creating session.", error: err.message });
      }
      res.status(201).json({
        message: "Attendance session created successfully.",
        sessionId: result.insertId,
      });
    }
  );
};

// get attendance
exports.getAttendance = (req, res) => {
  const sessionId = req.params.sessionId;

  const sql = `
    SELECT 
      s.id,
      s.prn,
      s.name, 
      s.roll_no, 
      COALESCE(a.timestamp, 'Absent') AS timestamp
    FROM 
      students s
    LEFT JOIN 
      attendance a ON s.id = a.student_id AND a.session_id = ?
    JOIN 
      sessions ses ON ses.id = ?
    WHERE 
      s.branch = ses.branch AND s.division = ses.division
    ORDER BY 
      s.roll_no;
  `;

  db.query(sql, [sessionId, sessionId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Error fetching attendance data.",
        error: err.message,
      });
    }
    res.json(results);
  });
};

// toggle attendance
exports.toggleAttendance = (req, res) => {
  const { studentId, sessionId } = req.params;

  // Check if the student has already marked attendance
  const checkAttendanceSql = `
    SELECT * FROM attendance 
    WHERE student_id = ? AND session_id = ?`;

  db.query(checkAttendanceSql, [studentId, sessionId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Error checking attendance status.",
        error: err.message,
      });
    }

    if (results.length > 0) {
      // Attendance exists, so remove it (mark as Absent)
      const deleteAttendanceSql = `
        DELETE FROM attendance 
        WHERE student_id = ? AND session_id = ?`;

      db.query(deleteAttendanceSql, [studentId, sessionId], (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Error removing attendance record.",
            error: err.message,
          });
        }
        res.status(200).json({
          message: "Attendance marked as Absent successfully.",
        });
      });
    } else {
      // Attendance does not exist, so mark it (mark as Present)
      const markAttendanceSql = `
        INSERT INTO attendance (student_id, session_id) 
        VALUES (?, ?)`;

      db.query(markAttendanceSql, [studentId, sessionId], (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Error marking attendance.",
            error: err.message,
          });
        }
        res.status(201).json({
          message: "Attendance marked as Present successfully.",
        });
      });
    }
  });
};

// mark attendance
exports.markAttendance = (req, res) => {
  const { prn, sessionId } = req.body; // Face photo included in the request
  const studentIp = extractIPv4(req.ip);

  const facePhoto = req.file;

  // Fetch the student details using PRN
  const studentSql = "SELECT * FROM students WHERE prn = ?";
  db.query(studentSql, [prn], async (err, studentResult) => {
    if (err || studentResult.length === 0) {
      return res
        .status(404)
        .json({ message: "Student not found or error occurred." });
    }

    const studentId = studentResult[0].id; // Get the student ID from the result
    const storedFaceId = studentResult[0].face_id; // Get the face encoding from the result

    // Compare face using Flask API
    try {
      const faceMatch = await compareFace(facePhoto, storedFaceId); // Use the compareFace function

      if (!faceMatch) {
        console.log("not match");
        return res
          .status(403)
          .json({ message: "Face mismatch. Attendance cannot be marked." });
      }
      console.log("match");
      // Proceed with MAC address and subnet verification (same as before)...
      getMacAddress(studentIp, (macErr, detectedMacAddress) => {
        if (macErr) {
          console.log("Error retrieving MAC address.");
          return res.status(500).json({
            message: "Error retrieving MAC address.",
            error: macErr.message,
          });
        }

        // Verify MAC address
        const storedMacAddress = studentResult[0].mac_address;
        console.log(storedMacAddress);
        if (
          storedMacAddress.toLowerCase() !== detectedMacAddress.toLowerCase()
        ) {
          console.log("MAC address mismatch. Attendance cannot be marked.");
          return res.status(403).json({
            message: "MAC address mismatch. Attendance cannot be marked.",
          });
        }

        // Verify if student's subnet matches the faculty's session subnet
        const sessionSql = "SELECT * FROM sessions WHERE id = ?";
        db.query(sessionSql, [sessionId], (err, sessionResult) => {
          if (err || sessionResult.length === 0) {
            console.log("Session not found or error occurred.");
            return res
              .status(404)
              .json({ message: "Session not found or error occurred." });
          }

          const stuBranch = studentResult[0].branch;
          const stuDivision = studentResult[0].division;

          const facultyBranch = sessionResult[0].branch;
          const facultyDivision = sessionResult[0].division;

          if (!(stuBranch == facultyBranch && stuDivision == facultyDivision)) {
            return res.status(403).json({
              message: "Session does not match with your credentials.",
            });
          }

          const facultyIp = sessionResult[0].faculty_ip;
          const facultySubnet = getSubnet(facultyIp);
          const studentSubnet = getSubnet(studentIp);

          if (facultySubnet !== studentSubnet) {
            return res.status(403).json({
              message: "Access denied. Connect to the correct hotspot.",
            });
          }

          // Check if student has already marked attendance within 10 minutes
          const attendanceSql =
            "SELECT * FROM attendance WHERE student_id = ? AND session_id = ? AND timestamp > NOW() - INTERVAL 10 MINUTE";
          db.query(
            attendanceSql,
            [studentId, sessionId],
            (err, attendanceResult) => {
              if (err) {
                return res.status(500).json({
                  message: "Error checking attendance.",
                  error: err.message,
                });
              }
              if (attendanceResult.length > 0) {
                return res
                  .status(429)
                  .json({ message: "Attendance already marked recently." });
              }

              // Mark attendance
              const markSql =
                "INSERT INTO attendance (student_id, session_id) VALUES (?, ?)";
              db.query(markSql, [studentId, sessionId], (err, result) => {
                if (err) {
                  return res.status(500).json({
                    message: "Error marking attendance.",
                    error: err.message,
                  });
                }
                res
                  .status(201)
                  .json({ message: "Attendance marked successfully." });
              });
            }
          );
        });
      });
    } catch (faceError) {
      console.log(faceError);
      return res.status(500).json({
        message: "Error comparing face.",
        error: faceError.message,
      });
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
  });
};

// Helper function to compare face using Flask API
const compareFace = async (facePhoto, storedFaceId) => {
  try {
    const formData = new FormData();
    formData.append("face_id_encoding", JSON.stringify(storedFaceId)); // Ensure it's stringified
    formData.append("face_photo", fs.createReadStream(facePhoto.path));

    // Send the captured face to CompreFace for comparison
    const response = await axios.post(
      "http://192.168.9.14:8080/compare_faces",
      formData,
      {
        headers: {
          ...formData.getHeaders(), // Include multipart headers
        },
      }
    );

    return response.data.match; // Return true if faces match
  } catch (error) {
    console.error(
      "Face comparison error:",
      error.response?.data || error.message
    );
    throw new Error("Face comparison failed");
  }
};
