var test = require('node:test');
var assert = require('node:assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var testFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'fse-chat-room-'));

process.env.JWT_SECRET = 'test-secret-for-api-tests-with-32-characters';
process.env.DATABASE_PATH = path.join(testFolder, 'test.db');

var app = require('../server/app');
var db = require('../server/db');
var baseUrl = '';

test.before(async function () {
    await new Promise(function (resolve) {
        app.server.listen(0, '127.0.0.1', function () {
            baseUrl = 'http://127.0.0.1:' + app.server.address().port;
            resolve();
        });
    });
});

test.after(async function () {
    await new Promise(function (resolve) {
        app.io.close(function () {
            resolve();
        });
    });

    if (db.open) {
        db.close();
    }

    fs.rmSync(testFolder, {
        recursive: true,
        force: true
    });
});

function sendRequest(url, method, body, token) {
    var headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers.Authorization = 'Bearer ' + token;
    }

    return fetch(baseUrl + url, {
        method: method,
        headers: headers,
        body: JSON.stringify(body)
    });
}

test('register, login and message APIs work', async function () {
    var response = await sendRequest('/api/register', 'POST', {
        password: 'password123'
    });
    assert.strictEqual(response.status, 400);

    response = await sendRequest('/api/register', 'POST', {
        username: 'alice',
        password: 'password123'
    });
    assert.strictEqual(response.status, 201);

    response = await sendRequest('/api/register', 'POST', {
        username: 'a'.repeat(31),
        password: 'password123'
    });
    assert.strictEqual(response.status, 400);

    response = await sendRequest('/api/register', 'POST', {
        username: 'bob',
        password: 'a'.repeat(73)
    });
    assert.strictEqual(response.status, 400);

    response = await sendRequest('/api/login', 'POST', {
        username: 'alice',
        password: 'wrong-password'
    });
    assert.strictEqual(response.status, 401);

    response = await sendRequest('/api/login', 'POST', {
        username: 'alice',
        password: 'password123'
    });
    assert.strictEqual(response.status, 200);

    var loginData = await response.json();
    var token = loginData.token;
    assert.ok(token);

    response = await fetch(baseUrl + '/api/me', {
        headers: {
            Authorization: 'Bearer ' + token
        }
    });
    assert.strictEqual(response.status, 200);

    var user = await response.json();
    assert.strictEqual(user.username, 'alice');

    response = await sendRequest('/api/messages', 'POST', {}, token);
    assert.strictEqual(response.status, 400);

    response = await sendRequest('/api/messages', 'POST', {
        text: 'a'.repeat(2001)
    }, token);
    assert.strictEqual(response.status, 400);

    response = await sendRequest('/api/messages', 'POST', {
        text: 'Hello world'
    }, token);
    assert.strictEqual(response.status, 201);

    response = await fetch(baseUrl + '/api/messages', {
        headers: {
            Authorization: 'Bearer ' + token
        }
    });
    assert.strictEqual(response.status, 200);

    var data = await response.json();
    assert.strictEqual(data.messages.length, 1);
    assert.strictEqual(data.messages[0].username, 'alice');
    assert.strictEqual(data.messages[0].text, 'Hello world');
    assert.ok(data.messages[0].id);
    assert.match(data.messages[0].createdAt, /Z$/);
    assert.strictEqual(data.hasMore, false);
    assert.strictEqual(data.nextBeforeId, null);

    var alice = db.prepare('SELECT id FROM users WHERE username = ?').get('alice');
    var insertMessage = db.prepare('INSERT INTO messages (user_id, text) VALUES (?, ?)');
    var insertMessages = db.transaction(function () {
        for (var i = 1; i <= 50; i++) {
            insertMessage.run(alice.id, 'Message ' + i);
        }
    });
    insertMessages();

    response = await fetch(baseUrl + '/api/messages', {
        headers: {
            Authorization: 'Bearer ' + token
        }
    });
    assert.strictEqual(response.status, 200);

    data = await response.json();
    assert.strictEqual(data.messages.length, 50);
    assert.strictEqual(data.messages[0].text, 'Message 1');
    assert.strictEqual(data.messages[49].text, 'Message 50');
    assert.strictEqual(data.hasMore, true);
    assert.strictEqual(data.nextBeforeId, data.messages[0].id);

    response = await fetch(baseUrl + '/api/messages?before=' + data.nextBeforeId, {
        headers: {
            Authorization: 'Bearer ' + token
        }
    });
    assert.strictEqual(response.status, 200);

    data = await response.json();
    assert.strictEqual(data.messages.length, 1);
    assert.strictEqual(data.messages[0].text, 'Hello world');
    assert.strictEqual(data.hasMore, false);
    assert.strictEqual(data.nextBeforeId, null);

    response = await fetch(baseUrl + '/api/messages?before=invalid', {
        headers: {
            Authorization: 'Bearer ' + token
        }
    });
    assert.strictEqual(response.status, 400);

    for (var i = 0; i < 19; i++) {
        response = await sendRequest('/api/login', 'POST', {
            username: 'unknown-user',
            password: 'wrong-password'
        });
    }

    assert.strictEqual(response.status, 429);
});
