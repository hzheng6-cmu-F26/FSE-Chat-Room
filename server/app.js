require('dotenv').config(); 
var path = require('path');
var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var rateLimit = require('express-rate-limit');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken'); 
var formatMessage = require('./utils/messages');
var registerAuthRoutes = require('./controllers/auth.controller');
var registerChatRoutes = require('./controllers/chat.controller');

var JWT_SECRET = process.env.JWT_SECRET; 
var PORT = process.env.PORT || 3000;

if (!JWT_SECRET ||
    JWT_SECRET.trim().length < 32 ||
    JWT_SECRET === 'replace-with-a-long-random-secret') {
    throw new Error('JWT_SECRET must be a private value with at least 32 characters');
}

var db = require('./db');
var app = express();
var server = http.createServer(app);
var io = socketio(server);
var registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many registration attempts. Please try again later.'
    }
});
var loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many login attempts. Please try again later.'
    }
});
var messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: function (req) {
        return String(req.user.userId);
    },
    message: {
        message: 'You are sending messages too quickly. Please try again later.'
    }
});

app.use(express.json({
    limit: '16kb'
})); 
app.use(express.static(path.join(__dirname, '../client'))); 
app.use(express.static(path.join(__dirname, '../client/pages')));

// Identify JWT, when http requests.
function checkToken(req, res, next) {
    var authHeader = req.headers.authorization;

    if (!authHeader || authHeader.indexOf('Bearer ') !== 0) {
        return res.status(401).json({
            message: 'Authentication information missing. Please log in again.'
        });
    }

    var token = authHeader.split(' ')[1]; 

    try {
        req.user = jwt.verify(token, JWT_SECRET); 
        next();
    } catch (error) {
        res.status(403).json({
            message: 'Your login has expired. Please log in again'
        });
    }
}

// identify JWT, when using socket.io
io.use(function (socket, next) {
    var token = '';

    if (socket.handshake.auth) {
        token = socket.handshake.auth.token;
    }

    if (!token) {
        var missingTokenError = new Error('Authentication information missing. Please log in again');
        missingTokenError.data = {
            code: 'AUTH_REQUIRED'
        };
        return next(missingTokenError);
    }

    try {
        socket.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        var invalidTokenError = new Error('Your login has expired. Please log in again');
        invalidTokenError.data = {
            code: 'AUTH_INVALID'
        };
        next(invalidTokenError);
    }
});

io.on('connection', function (socket) {
    var expiresAt = socket.user.exp * 1000;
    var timeUntilExpiry = Math.max(0, expiresAt - Date.now());
    var expirationTimer = setTimeout(function () {
        socket.emit('auth_expired');
        socket.disconnect(true);
    }, timeUntilExpiry);

    socket.on('disconnect', function () {
        clearTimeout(expirationTimer);
    });
});

registerAuthRoutes(app, db, bcrypt, jwt, JWT_SECRET, registerLimiter, loginLimiter);
registerChatRoutes(app, io, db, formatMessage, checkToken, messageLimiter);

if (require.main === module) {
    server.listen(PORT, function () {
        console.log('Server is running on port ' + PORT);
    });
}

module.exports = {
    server: server,
    io: io
};
