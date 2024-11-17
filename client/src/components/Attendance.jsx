//components/Attendance.jsx
import React, { useState } from "react";
import { markAttendance } from "../api";
import { toast } from "react-toastify";

const Attendance = () => {
  const [formData, setFormData] = useState({
    prn: "",
    sessionId: "",
    facePhoto: null,
  });
  const [loading, setLoading] = useState(false); // Loading state
  const [fileName, setFileName] = useState("No file chosen"); // State to track selected file
  const [previewUrl, setPreviewUrl] = useState(null); // State for image preview
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, facePhoto: file });
    setFileName(file ? "Face Uploaded" : "No file chosen"); // Update the file name
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null); // Clear preview if no file is chosen
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Enable loading state
    try {
      const form = new FormData();
      for (const key in formData) {
        form.append(key, formData[key]);
      }

      const response = await markAttendance(form);

      // Assuming your backend returns a status of 201 for success
      if (response.status === 201) {
        toast.success(
          "Attendance marked successfully!\nNow disconnect from wifi."
        );
      }
    } catch (error) {
      console.error("Error marking attendance:", error);

      // Check if error response exists and contains a message from backend
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(
          `Failed to mark attendance: ${error.response.data.message}`
        );
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false); // Disable loading state after submission
    }
  };

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: loading ? "not-allowed" : "pointer",
    borderRadius: "5px",
    backgroundColor: "beige",
    color: "black",
    border: "none",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    opacity: loading ? 0.6 : 1,
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Mark Attendance</h1>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          name="prn"
          placeholder="PRN"
          value={formData.prn}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          type="text"
          name="sessionId"
          placeholder="Session ID"
          value={formData.sessionId}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <div style={fileUploadContainer}>
          <label htmlFor="facePhoto" style={customFileInputButton}>
            Upload Face Photo
          </label>
          <span style={fileNameStyle}>{fileName}</span>
          <input
            id="facePhoto"
            type="file"
            name="facePhoto"
            capture
            onChange={handleFileChange}
            style={hiddenFileInput} // Hide default file input
          />
        </div>
        {previewUrl && (
          <img src={previewUrl} alt="Face Preview" style={previewStyle} />
        )}

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Marking Attendance..." : "Mark Attendance"}
        </button>
      </form>
    </div>
  );
};
export default Attendance;

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  backgroundColor: "#f0f4f8", // Light blue-gray background
  textAlign: "center",
};

const headerStyle = {
  position: "absolute",
  top: "5%",
  fontSize: "2rem",
  color: "#111", // Primary blue color for text
  marginBottom: "40px",
  border: "2px solid #444",
  padding: "10px",
  borderRadius: "10px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "15px",
};

const inputStyle = {
  padding: "10px",
  fontSize: "16px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  width: "300px",
};

const fileUploadContainer = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "15px",
};

const hiddenFileInput = {
  display: "none", // Hide default input
};

const customFileInputButton = {
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  cursor: "pointer",
  borderRadius: "5px",
  fontSize: "16px",
  transition: "background-color 0.3s ease",
};

const fileNameStyle = {
  color: "#ccc",
};

const previewStyle = {
  marginTop: "10px",
  maxWidth: "80%",
  maxHeight: "300px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  objectFit: "cover",
};
