import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAttendance, toggleStudentAttendance } from "../api"; // Assuming you have this API
import * as XLSX from "xlsx"; // Import the xlsx library

const ViewAttendance = ({ isLoggedIn }) => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await getAttendance(sessionId);
        setAttendanceData(response.data);
        console.log(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [sessionId]);

  const handleToggleAttendance = async (studentId) => {
    if (!isLoggedIn) return;
    try {
      await toggleStudentAttendance(sessionId, studentId); // Call the API to toggle attendance
      const updatedAttendance = await getAttendance(sessionId); // Fetch the updated attendance data
      setAttendanceData(updatedAttendance.data);
    } catch (err) {
      console.error("Failed to toggle attendance", err);
    }
  };

  const handleDownloadExcel = () => {
    // Exclude 'id' field before converting to Excel
    const filteredData = attendanceData.map(({ id, ...rest }) => rest);

    const worksheet = XLSX.utils.json_to_sheet(filteredData); // Convert filtered data to sheet
    const workbook = XLSX.utils.book_new(); // Create a new workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance"); // Append the sheet
    XLSX.writeFile(workbook, `attendance_session_${sessionId}.xlsx`); // Export the Excel file
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/")} style={homeButtonStyle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="20px"
          height="20px"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        Home
      </button>
      <h1 style={headerStyle}>Attendance for Session {sessionId}</h1>
      {isLoggedIn && (
        <button onClick={handleDownloadExcel} style={downloadButtonStyle}>
          Download as Excel
        </button>
      )}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Roll No</th>
            <th style={thStyle}>Attendance Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.length > 0 &&
            attendanceData.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.roll_no}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleToggleAttendance(item.id)}
                    style={
                      item.timestamp.includes("Absent")
                        ? absentButtonStyle
                        : presentButtonStyle
                    }
                  >
                    {item.timestamp.includes("Absent") ? "Absent" : "Present"}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

// Add styles for download button
const downloadButtonStyle = {
  marginBottom: "20px",
  padding: "10px 20px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const containerStyle = {
  padding: "20px",
  maxWidth: "800px",
  margin: "0 auto",
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  position: "relative", // To position the home button
};

const homeButtonStyle = {
  position: "absolute",
  top: "20px",
  right: "20px",
  padding: "10px",
  color: "#fff",
  backgroundColor: "transparent",
  border: "none",
  display: "flex",
  cursor: "pointer",
  alignItems: "center",
  gap: "4px",
  padding: "10px 15px",
  backgroundColor: "#007bff",
  borderRadius: "4px",
};

const headerStyle = {
  fontSize: "2em",
  marginBottom: "20px",
  color: "#333",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  borderBottom: "2px solid #ddd",
  padding: "10px",
  textAlign: "left",
  backgroundColor: "#f4f4f4",
};

const tdStyle = {
  borderBottom: "1px solid #ddd",
  padding: "10px",
};

const presentButtonStyle = {
  padding: "5px 15px",
  backgroundColor: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const absentButtonStyle = {
  padding: "5px 15px",
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default ViewAttendance;
