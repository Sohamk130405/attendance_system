import { createAttendanceSession } from "../api";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { toast } from "react-toastify";
const CreateSession = () => {
  const [formData, setFormData] = useState({
    subject: "",
    branch: "",
    division: "",
  });

  const [branches, setBranches] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const navigate = useNavigate(); // Create navigate function

  useEffect(() => {
    // Fetch branches and divisions from API or define them here
    const fetchBranchesAndDivisions = () => {
      try {
        // Example static data
        const branchesData = ["Comp", "CSAI", "AIDS", "CSAIML"];
        const divisionsData = ["A", "B", "C", "D"];
        const subjectData = [
          "Internet Of Things",
          "Database Management System",
          "Data Science",
          "Object Oriented Programming",
          "Mobile App Development",
          "Problem Solving And Programming",
        ];

        setBranches(branchesData);
        setDivisions(divisionsData);
        setSubjects(subjectData);
      } catch (error) {
        console.error("Error fetching branches and divisions:", error);
      }
    };

    fetchBranchesAndDivisions();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const facultyId = localStorage.getItem("facultyId");

    if (!facultyId) {
      toast.error("Faculty ID is not available. Please log in again."); // Use toast for error
      return;
    }

    try {
      const response = await createAttendanceSession({
        ...formData,
        facultyId,
      });
      toast.success("Attendance session created successfully!"); // Use toast for success

      // Redirect to View Attendance page with the session ID
      navigate(`/view-attendance/${response.data.sessionId}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create attendance session."); // Use toast for error
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Create Attendance Session</h1>
      <form onSubmit={handleSubmit} style={formStyle}>
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
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          style={inputStyle}
        >
          <option value="" disabled>
            Select Subject
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <button type="submit" style={buttonStyle}>
          Create Session
        </button>
      </form>
    </div>
  );
};

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

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "5px",
  backgroundColor: "beige",
  color: "black",
  border: "none",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

export default CreateSession;
