//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const express = require('express');
const router = express.Router();
const { json } = require('body-parser');
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
        message: 'Auth succesful'
    });
});
router.get('/:userName', (req, res) => {
    //Get user based on id
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
router.get('/:email', (req, res) => {
    //Get user based on id
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
router.post('/signup', (req, res) => {
    const user = req.body;
    //Check if user filled it the minimum required details
    if(user.email === undefined || user.username === undefined || user.password === undefined || user.source === undefined) { 
        res.status(500).json({message:'No email, name or password given.'});
        return; 
    }
    //Check if email, username and password are valid
    if(!isemail.validate(user.email) || !(/[A-Za-z\s]/g.test(user.username)) || passwordValidator.validate(user.password, { list: true }).length > 0) {
        res.status(500).json({ message: 'Email, name or password not valid' });
        return; 
    }
    //Check if user with email already exists
    db.get(['user_id'], 'user_accounts', {user_email: user.email}, (response) => {
        if(!response.result) res.status(500).json({ message: 'User already exists with this email' });
        return; 
    });
    //Create user
    db.create('user_accounts', { user_name: user.username, user_email: user.email, user_password: bcrypt.hashSync(user.password, parseInt(process.env.SALT_ROUNDS)), user_creation_date: moment().format('YYYY-MM-DD hh:mm:ss') }, (response) => {
        if(!response.result) {
            console.log(response);
            res.status(500).json({ message: 'Failed to create account' });
            return; 
        }
        //If succesfull create new token to return 
        const token = jwt.sign({id: user._id, Username: user.Username, Email: user.Email, source: req.body.source },
                                process.env.JWT_KEY, { expiresIn: "30d" });
        //Respond with token
        res.status(200).json({ message: 'Account created!', token: token });
    });
});
router.get('/:userId', (req, res) => {
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



module.exports = router;