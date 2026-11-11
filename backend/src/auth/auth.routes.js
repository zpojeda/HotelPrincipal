const express = require("express");
const { registro } = require("./auth.controller");


const router = express.Router(); 
router.post("/registro", registro);

module.exports = router; 