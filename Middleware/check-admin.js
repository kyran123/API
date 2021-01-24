const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        //TODO: check if user is admin
        console.log(decoded);
        if(decoded.admin === 1) {
            next();
        }
    } catch (error) {
        return res.status(200).json({
            message: 'Auth failed'
        });
    }
};