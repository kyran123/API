//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const express = require('express');
const router = express.Router();
const { json } = require('body-parser');

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
// Handle get requests                                              //
//------------------------------------------------------------------//












module.exports = router;