const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');

router.post('/login', verificationController.login);

router.post('/register', verificationController.register);

module.exports = router;