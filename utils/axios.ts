const axios = require("axios").default;

const url = "https://flask-pdfextractor.onrender.com";
// const url = "http://127.0.0.1:8080";

export default axios.create({
  baseURL: url,
  withCredentials: true,
});
