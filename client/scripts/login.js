const loginForm = document.getElementById('loginForm');
const registerBtn = document.getElementById('registerBtn');
const authMsg = document.getElementById('authMsg');


loginForm.addEventListener('submit', loginUser);
registerBtn.addEventListener('click', registerUser);

// login
async function loginUser(event) {
    event.preventDefault();

    const username = loginForm.elements.username.value;
    const password = loginForm.elements.password.value;

    // clear hints from last time
    authMsg.textContent = '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();


        if (!response.ok) {
            authMsg.textContent = data.message;
            return;
        }

        //save token then jump to the chat room
        sessionStorage.setItem('token', data.token);
        window.location.href = '/chat.html';

    } catch (error) {
        authMsg.textContent = 'Unable to connect to the server';
    }
}

// register
async function registerUser() {
    if (!loginForm.reportValidity()) {
        return;
    }

    const username = loginForm.elements.username.value;
    const password = loginForm.elements.password.value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        authMsg.textContent = data.message;

    } catch (error) {
        authMsg.textContent = 'Unable to connect to the server';
    }
}