//components/Register.jsx
import { registerStudent } from "../api";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify"; // Make sure to import toast

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    prn: "",
    rollNo: "",
    branch: "",
    division: "",
    facePhoto: null,
  });

  const [branches, setBranches] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("No file chosen"); // Track file name
  const [previewUrl, setPreviewUrl] = useState(null); // State for image preview

  useEffect(() => {
    const fetchBranchesAndDivisions = () => {
      try {
        const branchesData = ["Comp", "CSAI", "AIDS", "CSAIML"];
        const divisionsData = ["A", "B", "C", "D"];

        setBranches(branchesData);
        setDivisions(divisionsData);
      } catch (error) {
        console.error("Error fetching branches and divisions:", error);
      }
    };

    fetchBranchesAndDivisions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, facePhoto: file });
    setFileName(file ? "Face Uploaded" : "No file chosen"); // Update file name

    // Create a preview URL for the uploaded image
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

      const response = await registerStudent(form);

      // Assuming your backend returns a status of 201 for success
      if (response.status === 201) {
        toast.success("Student registered successfully!");
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Check if error response exists and contains a message
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(
          `Failed to register student: ${error.response.data.message}`
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
    width: "100%",
    cursor: loading ? "not-allowed" : "pointer", // Change cursor when disabled
    borderRadius: "5px",
    backgroundColor: "beige",
    color: "black",
    border: "none",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    opacity: loading ? 0.6 : 1, // Dim button when loading
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Register</h1>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          style={inputStyle}
        />
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
          name="rollNo"
          placeholder="Roll Number"
          value={formData.rollNo}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <div style={divStyle}>
          <select
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            required
            style={dropDownStyle}
          >
            <option value="" disabled>
              Select Branch
            </option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <select
            name="division"
            value={formData.division}
            onChange={handleChange}
            required
            style={dropDownStyle}
          >
            <option value="" disabled>
              Select Division
            </option>
            {divisions.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>

        <div style={fileUploadContainer}>
          <label htmlFor="facePhoto" style={customFileInputButton}>
            Upload Face Photo
          </label>
          <span style={fileNameStyle}>{fileName}</span>
          <input
            id="facePhoto"
            type="file"
            name="facePhoto"
            onChange={handleFileChange}
            style={hiddenFileInput} // Hide default input
            required
          
          />
        </div>

        {/* Preview of uploaded face photo */}
        {previewUrl && (
          <img src={previewUrl} alt="Face Preview" style={previewStyle} />
        )}

        <button
          type="submit"
          style={buttonStyle}
          disabled={loading} // Disable button when loading
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
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

const divStyle = {
  display: "flex",
  width: "100%",
  gap: "5px",
};

const dropDownStyle = {
  flex: "1",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
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

// Container style with white background
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  backgroundColor: "#f0f4f8", // Light blue-gray background
  textAlign: "center",
};

// Header style with blue text color
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

export default Register;
