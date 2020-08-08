//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

//------------------------------------------------------------------//
// Import middlewares                                               //
//------------------------------------------------------------------//
const checkAuth = require('../Middleware/check-auth.js');
const checkAdmin = require('../Middleware/check-admin.js');

//------------------------------------------------------------------//
// Setup rate limiter                                               //
//------------------------------------------------------------------//
const limiter = rateLimit({
    windowMs: 60 * 1000, //1 minutes
    max: 20 //Max 10 requests
});
const speedLimiter = slowDown({
    windowMs: 60 * 1000, //1 minutes
    delayAfter: 10,
    delayMs: 500
});


router.get('/', limiter, speedLimiter, (req, res) => {
    return res.json({ response: 'Succesfull' });
});



module.exports = router;