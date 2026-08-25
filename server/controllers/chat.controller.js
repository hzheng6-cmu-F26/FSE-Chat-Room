function registerChatRoutes(app, io, db, formatMessage, checkToken, messageLimiter) {
// identify token and get information about user
app.get('/api/me', checkToken, function (req, res) {
    res.json({
        userId: req.user.userId,
        username: req.user.username
    });
});

// get all history message
app.get('/api/messages', checkToken, function (req, res) {
    var beforeValue = req.query.before;
    var beforeId = null;
    var pageSize = 50;

    if (beforeValue !== undefined) {
        if (typeof beforeValue !== 'string' || !/^[1-9][0-9]*$/.test(beforeValue)) {
            return res.status(400).json({
                message: 'Invalid message cursor'
            });
        }

        beforeId = Number(beforeValue);

        if (!Number.isSafeInteger(beforeId)) {
            return res.status(400).json({
                message: 'Invalid message cursor'
            });
        }
    }

    try {
        var query =
            "SELECT messages.id, users.username, messages.text, " +
            "strftime('%Y-%m-%dT%H:%M:%SZ', messages.created_at) " +
            'AS createdAt FROM messages ' +
            'JOIN users ON users.id = messages.user_id ';
        var messages;

        if (beforeId !== null) {
            query += 'WHERE messages.id < ? ';
            query += 'ORDER BY messages.id DESC LIMIT ?';
            messages = db.prepare(query).all(beforeId, pageSize + 1);
        } else {
            query += 'ORDER BY messages.id DESC LIMIT ?';
            messages = db.prepare(query).all(pageSize + 1);
        }

        var hasMore = messages.length > pageSize;

        if (hasMore) {
            messages.pop();
        }

        messages.reverse();

        res.json({
            messages: messages,
            hasMore: hasMore,
            nextBeforeId: hasMore && messages.length > 0 ? messages[0].id : null
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error'
        });
    }
});


app.post('/api/messages', checkToken, messageLimiter, function (req, res) {
    // check whether message exists
    if (!req.body || typeof req.body.text !== 'string') {
        return res.status(400).json({
            message: 'Please enter message'
        });
    }
    
    // in case the message is null
    var text = req.body.text.trim();
    
    if (!text) {
        return res.status(400).json({
            message: 'Please enter message'
        });
    }

    if (text.length > 2000) {
        return res.status(400).json({
            message: 'Message must be 2000 characters or fewer'
        });
    }

    // save message to db
    try {
        var result = db.prepare(
            'INSERT INTO messages (user_id, text) VALUES (?, ?)'
        ).run(req.user.userId, text);

        var savedMessage = db.prepare(
            "SELECT id, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) " +
            'AS createdAt FROM messages WHERE id = ?'
        ).get(result.lastInsertRowid);

        var message = formatMessage(
            savedMessage.id,
            req.user.username,
            text,
            savedMessage.createdAt
        );
        // send the msg to all
        io.emit('message', message); 

        res.status(201).json({
            message: 'Message posted'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Unable to connect with server'
        });
    }
});
}

module.exports = registerChatRoutes;
