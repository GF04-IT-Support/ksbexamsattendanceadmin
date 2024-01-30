const axios = require("axios").default;

const url =
  process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080/api" : "/api";
// const url = "https://flask-pdfextractor.onrender.com";

export default axios.create({
  baseURL: url,
  withCredentials: true,
});
