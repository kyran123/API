//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const isemail = require('isemail');
const PasswordValidator = require("password-validator");
const passwordValidator = new PasswordValidator();
passwordValidator.is().min(8)
                 .is().max(100)
                 .has().uppercase()
                 .has().lowercase()
                 .has().not().spaces()
                 .is().not().oneOf([
    "password", "Password", "password123", "Password123", "p@ssw0rd", "P@ssw0rd"
]);
let moment = require('moment');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

//------------------------------------------------------------------//
// Import utility classes                                           //
//------------------------------------------------------------------//
const db = require('../../Utility/Database.js');


//------------------------------------------------------------------//
// Import middlewares                                               //
//------------------------------------------------------------------//
const checkAuth = require('../../Middleware/check-auth.js');
const checkAdmin = require('../../Middleware/check-admin.js');


//------------------------------------------------------------------//
// Handle get requests                                              //
//------------------------------------------------------------------//
router.get('/auth', checkAuth, (req, res) => {
    res.status(200).json({
        result: true,
        message: 'Auth succesful'
    });
});
router.get('/name/:userName', checkAdmin, (req, res) => {
    console.log("Getting user by username");
    //Get user based on user name
    const name = req.params.userName;
    db.get(['user_name', 'user_email'], 'user_accounts', name, (response) => {
        if(response.result) {
            res.json({
                result: true,
                name: response.data[0].user_name,
                email: response.data[0].user_email
            });
        } else {
            res.json({
                result: false,
                message: 'Not found'
            });
        }
    });
});
router.get('/email/:email', checkAdmin, (req, res) => {
    console.log("Getting user by email");
    //Get user based on email
    const email = req.params.userEmail;
    db.get(['user_name', 'user_email'], 'user_accounts', email, (response) => {
        if(response.result) {
            res.json({
                result: true,
                name: response.data[0].user_name,
                email: response.data[0].user_email
            });
        } else {
            res.json({
                result: false,
                message: 'Not found'
            });
        }
    });
});


router.get('/:userId', checkAdmin, (req, res) => {
    console.log("Getting user by id");
    //Get user based on id
    const id = req.params.userId;
    db.get(['user_name', 'user_email'], 'user_accounts', {user_id: id}, (response) => {
        if(response.result) {
            res.json({
                result: true,
                name: response.data[0].user_name,
                email: response.data[0].user_email
            });
        } else {
            res.json({
                result: false,
                message: 'Not found'
            });
        }
    });
});
router.get('/admin', checkAdmin, (req, res) => {
    res.status(200).json({
        message: 'Auth succesful'
    });
});


//------------------------------------------------------------------//
// Handle POST requests                                             //
//------------------------------------------------------------------//
const loginLimit = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 15
});
const loginSpeedLimit = slowDown({
        windowMs: 60 * 60 * 1000,
        delayAfter: 5,
        delayMs: 20
});
router.post('/login', loginLimit, loginSpeedLimit, (req, res) => {
    const user = req.body;
    //Check if user filled the minimum required details
    if(user.email === undefined || user.password === undefined) {
        res.status(500).json({message:'No email or password given'});
        return;
    }
    //Attempt to find user based on email
    db.get(['*'], 'user_accounts', {user_email: user.email}, (response) => {
        if(!response.result) { console.log("User not found"); return res.status(500).json({ result: false, message: 'Failed to login' }); }
        bcrypt.compare(user.password, response.data[0].user_password, (err, result) => {
            if(err || !result) { console.log("Password incorrect"); return res.status(500).json({ result: false, message: 'Failed to login' }); }
            const token = jwt.sign(
                {
                    id: response.data[0].user_id,
                    user_name: response.data[0].user_name,
                    user_email: response.data[0].user_email,
                    admin: response.data[0].user_admin
                },
                process.env.JWT_KEY, 
                { expiresIn: "30d" }
            );
            return res.status(200).json({ 
                result: true, 
                token: token,
                userName: response.data[0].user_name,
                id: response.data[0].user_id
            });
        });
    });
});

const registerLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 100
});
const registerSpeedLimit = slowDown({
    windowMs: 24 * 60 * 60 * 1000,
    delayAfter: 5,
    delayMs: 500
});
router.post('/signup', registerLimit, registerSpeedLimit, (req, res) => {
    console.log("signing up user");
    const user = req.body;
    //Check if user filled it the minimum required details
    if(user.email === undefined || user.username === undefined || user.password === undefined) { 
        res.status(200).json({ result: false, message:'No email, name or password given.' });
        return; 
    }
    //Check if email, username and password are valid
    if(!isemail.validate(user.email)) {
        res.status(200).json({ result: false, message: 'Invalid Email' });
        return;
    }
    if(!(/^[a-zA-Z]+$/.test(user.username))) {
        res.status(200).json({ result: false, message: 'Invalid Username' });
        return;
    }
    if(passwordValidator.validate(user.password, { list: true }).length > 0) {
        res.status(200).json({ result: false, message: 'Invalid password. Requires minimum of 8 characters and at least 1 uppercase letter.' });
        return;
    }
    //Check if user with email already exists
    db.get(['user_id'], 'user_accounts', {user_email: user.email}, (response) => {
        if(response.result){
            return res.status(200).json({ result: false, message: 'User already exists with this email' });
        } else {
            //Create user
            db.create('user_accounts', { user_name: user.username, user_email: user.email, user_password: bcrypt.hashSync(user.password, parseInt(process.env.SALT_ROUNDS)), user_creation_date: moment().format('YYYY-MM-DD hh:mm:ss') }, (response) => {
                console.log("Checking email");
                console.log(response);
                if(!response.result) {
                    return res.status(200).json({ result: false, message: 'Failed to create account' });
                }
                //If succesfull create new token to return 
                const token = jwt.sign({Username: user.Username, Email: user.Email, admin: 0 },
                                        process.env.JWT_KEY, { expiresIn: "30d" });
                //Respond with token
                res.status(200).json({ result: true, message: 'Account created!', token: token, Username: user.username, id: response.data.insertId });
            });
        }
    });
});

module.exports = router;