const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        User.findOne({userName: decoded.name})
            .exec()
            .then(user => {
                if(user) {
                    if(user.admin){
                        next();
                    }
                }
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                });
            });
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
    
};