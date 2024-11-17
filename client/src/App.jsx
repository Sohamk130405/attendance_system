import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Register from "./components/Register";
import Login from "./components/Login";
import Attendance from "./components/Attendance";
import CreateSession from "./components/CreateSession";
import ViewAttendance from "./components/ViewAttendance"; // Import the new component
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("facultyId")) {
      setIsLoggedIn(true);
    }
  });

  const handleLogout = () => {
    // Clear any tokens or session data
    localStorage.removeItem("facultyId");
    // Update the logged-in state
    setIsLoggedIn(false);
    // Redirect to the login page or home
    navigate("/login");
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={
              <Home isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/create-session" element={<CreateSession />} />
          <Route
            path="/view-attendance/:sessionId"
            element={<ViewAttendance isLoggedIn={isLoggedIn} />}
          />{" "}
          {/* Add the new route */}
        </Routes>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
};

export default App;
