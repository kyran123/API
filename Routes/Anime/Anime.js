//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const express = require('express');
const router = express.Router();
const { json } = require('body-parser');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

//------------------------------------------------------------------//
// Import utility classes                                           //
//------------------------------------------------------------------//
const db = require('../../Utility/Database.js');
const animeController = require('../../Controllers/Anime/AnimeController.js');


//------------------------------------------------------------------//
// Import middlewares                                               //
//------------------------------------------------------------------//
const checkAuth = require('../../Middleware/check-auth.js');
const checkAdmin = require('../../Middleware/check-admin.js');


//------------------------------------------------------------------//
// Setup rate limiter                                               //
//------------------------------------------------------------------//
const limiter = function(time, max) {
    let ms = defineTime(time);
    return rateLimit({
        windowMs: ms,
        max: max
    });
}
const speedLimiter = function(time, delayTime, delay) {
    let ms = defineTime(time);
    let delayMs = defineTime(delayTime);
    let delayIncreaseMs = defineTime(delay);
    return slowDown({
        windowMs: ms,
        delayAfter: delayMs,
        delayMs: delayIncreaseMs
    });
}

function defineTime(time) {
    if(typeof time !== 'string') return time;
    switch(time.toLowerCase()) {
        case 'month': return 30*24*60*60*1000;
        case 'weeks': return 14*24*60*60*1000;
        case 'week': return 7*24*60*60*1000;
        case 'day': return 24*60*60*1000;
        case 'hour': return 60*60*1000;
        default: return time;
    }
}


//------------------------------------------------------------------//
// Handle get requests                                              //
//------------------------------------------------------------------//
router.get('/get/:id', checkAuth, limiter('hour', 900), limiter('day', 5000), speedLimiter('hour', 300, 25), speedLimiter('day', 2500, 25), animeController.getAnimeById);
router.get('/search/:name', checkAuth, limiter('hour', 100), limiter('day', 500), speedLimiter('hour', 50, 25), speedLimiter('day', 400, 25), animeController.SearchAnime);


//------------------------------------------------------------------//
// Handle post requests                                             //
//------------------------------------------------------------------//
router.post('/add', checkAuth, limiter('hour', 100), limiter('day', 500), speedLimiter('hour', 50, 100), speedLimiter('day', 200, 100), animeController.addAnimeToUser);
router.post('/status', checkAuth, limiter('hour', 100), limiter('day', 500), speedLimiter('hour', 50, 100), speedLimiter('day', 200, 100), animeController.getAnimeUserData);











module.exports = router;