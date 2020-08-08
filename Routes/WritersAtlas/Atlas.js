//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const express = require('express');
const router = express.Router();
const pathLib = require('path');
const fs = require('fs');
const jsonFile = require('jsonfile');
const readdirp = require('readdirp');
const OwlBot = require('owlbot-js');
const dotEnv = require('dotenv').config();
const owlBot = OwlBot(process.env.OWLBOT_API.toString());
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

//------------------------------------------------------------------//
// Import middlewares                                               //
//------------------------------------------------------------------//
const checkAuth = require('../../Middleware/check-auth.js');
const checkAdmin = require('../../Middleware/check-admin.js');

//------------------------------------------------------------------//
// Setup rate limiter                                               //
//------------------------------------------------------------------//
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, //30 seconds
    max: 6 //Max 6 requests
});
const speedLimiter = slowDown({
    windowMs: 60 * 60 * 1000, //30 seconds
    delayAfter: 3,
    delayMs: 500
});


let cachedData;
let cacheTime;

router.get('/', limiter, speedLimiter, (req, res, next) => {
    //Check if we have chached the data already
    //In memory cache
    if(cacheTime && cacheTime > Date.now() - 24 * 60 * 60 * 1000) {
        return res.json(cachedData);
    }
    //If we don't have it cached, make new request
    try {
        this.wordData = [];
        readdirp(`${appRoot}/Data/WritersAtlas`, {fileFilter: '*.json'})
        .on('data', (entry) => {
            const { path } = entry;
            this.wordData.push(jsonFile.readFileSync(`${appRoot}/Data/WritersAtlas/${path}`));
        })
        .on('end', () => {
            cachedData = this.wordData;
            cacheTime = Date.now();
            cachedData.cacheTime = cacheTime;
            return res.json(cachedData);
        });
    } 
    catch(err) {
        console.error(err);
        next(err);  
    }    
});

let cachedVersion;
let versionCacheTime;

router.get('/version', limiter, speedLimiter, (req, res, next) => {
    //Check if we have chached the version data already
    //In memory cache
    if(versionCacheTime && versionCacheTime > Date.now() - 24 * 60 * 60 * 1000) {
        return res.json(cachedVersion);
    }
    //If we don't have it cached, make new request
    try {
        const versionData = jsonFile.readFileSync(`${appRoot}/Data/Version.json`);
        versionCacheTime = Date.now();
        cachedVersion = {
            cacheTime: versionCacheTime,
            version: versionData.version,
            name: versionData.updateName,
            notes: versionData.updateNotes
        }
        return res.json(cachedVersion);
    }
    catch(err) {
        console.error(err);
        next(err);
    }
});



const owlBotLimiter = rateLimit({
    windowMs: 30 * 1000, //30 seconds
    max: 30 //Max 30 requests
});
const owlBotSpeedLimiter = slowDown({
    windowMs: 30 * 1000, //30 seconds
    delayAfter: 10,
    delayMs: 25
});
const owlBotSpeedLimiterDaily = slowDown({
    windowMs: 24 * 60 * 60 * 1000, //24 hours / 1 day
    delayAfter: 500,
    delayMs: 25
});
router.get('/def/:word', owlBotLimiter, owlBotSpeedLimiter, owlBotSpeedLimiterDaily, (req, res, next) => {
    //Get the word parameter from link
    const word = req.params.word;
    //Get the definition
    owlBot.define(word)
    .then((result) => {
        return res.json(result);
    })
    .catch((err) => {
        console.error(err);
        next(err);
    });
});

module.exports = router;