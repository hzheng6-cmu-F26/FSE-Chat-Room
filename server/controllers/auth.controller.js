function registerAuthRoutes(app, db, bcrypt, jwt, JWT_SECRET, registerLimiter, loginLimiter) {
// register Server
app.post('/api/register', registerLimiter, async function (req, res) {
    if (!req.body ||
        typeof req.body.username !== 'string' ||
        typeof req.body.password !== 'string') {
        return res.status(400).json({
            message: 'Please enter username and password'
        });
    }

    var username = req.body.username.trim();
    var password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Please enter username and password'
        });
    }

    if (username.length > 30) {
        return res.status(400).json({
            message: 'Username must be 30 characters or fewer'
        });
    }

    if (bcrypt.truncates(password)) {
        return res.status(400).json({
            message: 'Password is too long'
        });
    }

    try {
        //password encryption
        var passwordHash = await bcrypt.hash(password, 10); 

        db.prepare(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)'
        ).run(username, passwordHash);

        res.status(201).json({
            message: 'Registration successful!'
        });
    } catch (error) {
        // justify unique
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') { 
            return res.status(409).json({
                message: 'Username already exists, please change one'
            });
        }

        res.status(500).json({
            message: 'Unable to connect to the server'
        });
    }
});

// login Server
app.post('/api/login', loginLimiter, async function (req, res) {
    if (!req.body ||
        typeof req.body.username !== 'string' ||
        typeof req.body.password !== 'string') {
        return res.status(400).json({
            message: 'Please enter username and password'
        });
    }

    var username = req.body.username.trim();
    var password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Please enter username and password'
        });
    }

    if (username.length > 30) {
        return res.status(400).json({
            message: 'Username must be 30 characters or fewer'
        });
    }

    if (bcrypt.truncates(password)) {
        return res.status(400).json({
            message: 'Password is too long'
        });
    }

    try {
        var user = db.prepare(
            'SELECT id, username, password_hash FROM users WHERE username = ?'
        ).get(username);

        // if the user not exist
        if (!user) {
            return res.status(401).json({
                message: 'User not found'
            });
        }

        // identify password
        var passwordMatches = await bcrypt.compare(password, user.password_hash); 

        if (!passwordMatches) {
            return res.status(401).json({
                message: ' Please enter correct password'
            });
        }

        // if login, give jwt
        var token = jwt.sign({
            userId: user.id,
            username: user.username
        }, JWT_SECRET, {
            expiresIn: '1h' 
        });

        res.json({
            message: 'Login successful',
            token: token
        });
    } catch (error) {
        res.status(500).json({
            message: 'Unable to connect to the server'
        });
    }
});
}

module.exports = registerAuthRoutes;
