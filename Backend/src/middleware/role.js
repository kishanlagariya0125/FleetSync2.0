/* Backward compat — authorize now lives in auth.js */
const { authorize } = require("./auth");
module.exports = authorize;