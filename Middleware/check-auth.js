const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if(
            decoded.source === process.env.WINDOWS_APP_SOURCE ||
            decoded.source === process.env.LINUX_APP_SOURCE ||
            decoded.source === process.env.MAC_APP_SOURCE ||
            decoded.source === process.env.WEB_SOURCE
        ) {
            req.userData = decoded;
            next();
        }
    } catch (error) {
        console.error('[Check-Auth] ' + error);
        return res.status(401).json({
            message: 'Authentication failed'
        });
    }
};