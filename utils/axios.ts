const axios = require("axios").default;

const url = "https://flask-pdfextractor.onrender.com";

export default axios.create({
  baseURL: url,
  withCredentials: true,
});
