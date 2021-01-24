//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pathLib = require('path');

global.appRoot = pathLib.resolve(__dirname);

//------------------------------------------------------------------//
// Import utility classes                                           //
//------------------------------------------------------------------//
const db = require('./Utility/Database.js');

//------------------------------------------------------------------//
// Setup morgan as middleware for logging                           //
//------------------------------------------------------------------//
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


//------------------------------------------------------------------//
// Setup for reverse proxy (nginx in this case) 					//
//------------------------------------------------------------------//
app.set('trust proxy', 1);

//------------------------------------------------------------------//
// Defining headers (To prevent CORS error)                         //
//------------------------------------------------------------------//
app.use((res, req, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	//Check if options request and return all options
	if(req.method === 'OPTIONS'){
		res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
		return res.status(200).json({});
	}
	//Continue script
	next();
});



//------------------------------------------------------------------//
// Import routes                                                    //
//------------------------------------------------------------------//
const userRoutes = require('./Routes/Users/Users.js');
const animeRoutes = require('./Routes/Anime/Anime.js');
const atlasRoutes = require('./Routes/WritersAtlas/Atlas.js');
const minesweeperRoutes = require('./Routes/MineSweeper/MineSweeper.js');
const testRoutes = require('./Routes/Test.js');



//------------------------------------------------------------------//
// Import middleware                                                //
//------------------------------------------------------------------//
const checkAdmin = require('./Middleware/check-admin.js');
const checkAuth = require('./Middleware/check-auth.js');


//------------------------------------------------------------------//
// Setup routes for applications                                    //
// (So the dockal api has it's seperate route file)                 //
//------------------------------------------------------------------//
app.use('/ping', testRoutes);
app.use('/users', userRoutes);
app.use('/anime', checkAuth, animeRoutes);
app.use('/atlas', atlasRoutes);
app.use('/minesweeper', minesweeperRoutes);



//------------------------------------------------------------------//
// Socket connections                                               //
//------------------------------------------------------------------//


//------------------------------------------------------------------//
// When no routes caught the request, handle error                  //
//------------------------------------------------------------------//
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});



//------------------------------------------------------------------//
// Setup server to listen to the given port                         //
//------------------------------------------------------------------//
console.log("server started");
const server = app.listen(process.env.APP_PORT);



//------------------------------------------------------------------//
// Gracefully exit program                                          //
//------------------------------------------------------------------//
process.on('SIGTERM', exitProgram);
process.on('SIGINT', exitProgram);
function exitProgram() {
	db.connection.end();
	console.log('Closing server...');
	server.close(() => {
		process.exit(0);
	});
}