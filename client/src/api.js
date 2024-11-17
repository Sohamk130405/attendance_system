import axios from "axios";

const API_URL = "http://192.168.24.14:5000/api";

export const registerStudent = (data) => {
  return axios.post(`${API_URL}/auth/register`, data);
};

export const loginFaculty = (data) => {
  return axios.post(`${API_URL}/auth/login`, data);
};

export const createAttendanceSession = (data) => {
  return axios.post(`${API_URL}/attendance/create-session`, data);
};

export const markAttendance = (data) => {
  return axios.post(`${API_URL}/attendance/mark-attendance`, data);
};

export const getAttendance = (sessionId) => {
  return axios.get(`${API_URL}/attendance/${sessionId}`);
};

export const toggleStudentAttendance = (sessionId, studentId) => {
  return axios.put(`${API_URL}/attendance/${sessionId}/${studentId}`);
};
