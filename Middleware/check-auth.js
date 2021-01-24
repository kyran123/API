const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        if(req.headers.authorization === undefined) { 
            return res.status(401).json({
                result: false,
                message: 'Authentication failed'
            });
        }
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decoded;
        next();
    } catch (error) {
        console.error('[Check-Auth] ' + error);
        return res.status(200).json({
            result: false,
            message: 'Authentication failed'
        });
    }
};