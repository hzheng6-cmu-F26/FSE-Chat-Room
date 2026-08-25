var postForm = document.getElementById('postForm');
var msgArea = document.querySelector('.msgArea');
var logoutBtn = document.querySelector('.logoutBtn');
var statusDisplay = document.getElementById('statusDisplay');

var token = sessionStorage.getItem('token');

var currentUsername = '';
var socket = null;
var messagesLoaded = false;
var pendingMessages = [];
var shownMessageIds = {};

postForm.addEventListener('submit', postMessage);
logoutBtn.addEventListener('click', logoutUser);

init();

function goLogin() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    window.location.replace('/');
}

// Establish a Socket.IO connection, jwt
function connectSocket() {
    socket = io({
        auth: {
            token: token
        }
    });

    // listen for new messages broadcast by the server
    socket.on('message', function (message) {
        if (!messagesLoaded) {
            pendingMessages.push(message);
            return;
        }

        showMessage(message);
        msgArea.scrollTop = msgArea.scrollHeight;
    });

    // if token cannot be authenticated 
    socket.on('connect_error', function (error) {
        if (error.message == 'Authentication information missing. Please log in again' || error.message == 'Your login has expired. Please log in again') {
            goLogin();
            return;
        }
        statusDisplay.textContent = 'Unable to connect';
    });
}
// check whether the user login
function init() {
    if (!token) {
        goLogin();
        return;
    }

    // identify token and get user information
    fetch('/api/me', {
        headers: {
            Authorization: 'Bearer ' + token
        }
    }).then(function (response) {
        if (!response.ok) {
            goLogin();
            return;
        }
        return response.json();
    }).then(function (user) {
        currentUsername = user.username;
        sessionStorage.setItem('username', user.username);
        connectSocket();

        // load history information
        return loadMessages().then(function () {
            messagesLoaded = true;

            for (var i = 0; i < pendingMessages.length; i++) {
                showMessage(pendingMessages[i]);
            }

            pendingMessages = [];
            msgArea.scrollTop = msgArea.scrollHeight;
        });
    }).catch(function () {
        goLogin();
    });
}

// update history function
function loadMessages() {
    return fetch('/api/messages', {
        headers: {
            Authorization: 'Bearer ' + token
        }
    }).then(function (response) {
        if (!response.ok) {
            throw new Error('Unable to load messages');
        }
        return response.json();
    }).then(function (data) {
        msgArea.innerHTML = '';
        shownMessageIds = {};

        for (var i = 0; i < data.messages.length; i++) {
            showMessage(data.messages[i]);
        }

        msgArea.scrollTop = msgArea.scrollHeight;
    });
}

// logout
function logoutUser(event) {
    event.preventDefault();
    goLogin();
}

// send message
function postMessage(event) {
    event.preventDefault();

    var input = postForm.elements.message;
    var text = input.value.trim();

    if (!text) {
        return;
    }

    statusDisplay.textContent = '';

    fetch('/api/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({
            text: text
        })
    }).then(function (response) {
        if (response.status == 401 || response.status == 403) {
            goLogin();
            return;
        }
        if (!response.ok) {
            return response.json().then(function (data) {
                statusDisplay.textContent = data.message;
            });
        }
        input.value = '';
        input.focus();
    }).catch(function () {
        statusDisplay.textContent = 'Unable to send message';
    });
}


function showMessage(message) {
    if (message.id && shownMessageIds[message.id]) {
        return;
    }

    if (message.id) {
        shownMessageIds[message.id] = true;
    }

    var name = message.username;
    if (message.username == currentUsername) {
        name = 'Me';
    }

    var box = document.createElement('div');
    box.className = 'message-card';

    var header = document.createElement('header');
    header.className = 'message-meta';

    var nameEl = document.createElement('strong');
    nameEl.textContent = name;

    var timeEl = document.createElement('time');
    var dateObj = new Date(message.createdAt);

    if (message.createdAt && !isNaN(dateObj.getTime())) {
        timeEl.textContent = dateObj.toLocaleString();
    } else if (message.time) {
        timeEl.textContent = message.time;
    } else {
        timeEl.textContent = '';
    }

    var textEl = document.createElement('p');
    textEl.textContent = message.text;

    header.appendChild(nameEl);
    header.appendChild(timeEl);
    box.appendChild(header);
    box.appendChild(textEl);
    msgArea.appendChild(box);
}
