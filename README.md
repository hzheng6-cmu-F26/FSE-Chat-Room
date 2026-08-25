# FSE Chat Room

FSE Chat Room is a full-stack, real-time chat application built with Node.js, Express, Socket.IO, and SQLite.

Users can register, log in, view previous messages, send new messages, and receive updates in real time without refreshing the page. User accounts and chat records are stored in a local SQLite database. Authentication is handled with JSON Web Tokens (JWTs), while passwords are securely hashed before they are stored.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Code Organization](#code-organization)
- [Setup Instructions](#setup-instructions)
  - [GitHub Codespaces](#github-codespaces)
  - [Local Installation](#local-installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [YouTube Video](#youtube-video)

## Features

- User registration and login
- Password hashing with `bcryptjs`
- JWT-protected API routes and Socket.IO connections
- Persistent message history stored in SQLite
- Real-time message delivery with Socket.IO
- Message-history pagination
- Registration, login, and message rate limiting
- Responsive browser interface
- API integration tests using Node.js's built-in test runner

## Technologies Used

### Frontend

| Technology | Purpose |
| --- | --- |
| HTML5 | Defines the login, registration, and chat room page structure. |
| CSS3 | Provides layout, responsive design, and visual styling. |
| JavaScript | Handles forms, authentication state, DOM updates, and real-time message rendering. |
| Fetch API | Sends requests for registration, login, user details, and messages. |
| Web Storage API (`sessionStorage`) | Stores the authentication token and username for the current browser session. |

### Backend and Real-Time Communication

| Technology | Purpose |
| --- | --- |
| Node.js 20+ | Runs the backend JavaScript application. |
| Express.js 5 | Serves static files and provides the authentication and messaging REST APIs. |
| Socket.IO | Creates authenticated real-time connections and broadcasts new messages. |
| CommonJS | Organizes backend modules with `require()` and `module.exports`. |

### Database, Authentication, and Security

| Technology | Purpose |
| --- | --- |
| SQL and SQLite | Define, query, and persist user and message data locally. |
| `better-sqlite3` | Connects the Node.js backend to SQLite and runs prepared statements. |
| `bcryptjs` | Hashes passwords during registration and verifies them during login. |
| `jsonwebtoken` | Creates and verifies JWTs for API routes and Socket.IO connections. |
| `express-rate-limit` | Limits registration, login, and message requests. |
| `dotenv` | Loads settings such as the JWT secret, port, and optional database path. |

### Development and Testing

| Technology | Purpose |
| --- | --- |
| npm | Installs dependencies and runs development, testing, startup, and packaging scripts. |
| Nodemon | Restarts the backend automatically when source files change during development. |
| Node.js Test Runner (`node:test`) | Runs API integration tests. |
| `node:assert` | Provides assertions for the test suite. |

## Code Organization

The project uses a client/server structure. The `client` directory contains browser-side files, while the `server` directory contains the backend, database, authentication, and real-time messaging logic. The application entry point is `server/app.js`, as defined in `package.json`.

```text
FSE-Chat-Room/
├── client/
│   ├── css/
│   │   └── style.css
│   ├── pages/
│   │   ├── chat.html
│   │   └── index.html
│   └── scripts/
│       ├── login.js
│       └── main.js
├── server/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── chat.controller.js
│   ├── models/
│   │   ├── chat.db
│   │   └── schema.sql
│   ├── utils/
│   │   └── messages.js
│   ├── app.js
│   └── db.js
├── test/
│   └── api.test.js
├── .env.example
├── package-lock.json
└── package.json
```

> `server/models/chat.db` is generated locally and excluded from Git.

### Client Side

- **`client/pages/index.html`** — Contains the login and registration forms and displays authentication messages.
- **`client/pages/chat.html`** — Contains the message history, message form, connection status, and logout control.
- **`client/scripts/login.js`** — Sends registration and login requests. After a successful login, it stores the JWT in `sessionStorage` and redirects the user to the chat page.
- **`client/scripts/main.js`** — Verifies the current user, loads message history, sends messages, connects to Socket.IO, renders real-time updates, prevents duplicate submissions, and handles logout or expired sessions.
- **`client/css/style.css`** — Provides shared styles and responsive layouts for the login and chat pages.

### Server Side

- **`server/app.js`** — Loads environment variables, creates the Express and HTTP servers, configures Socket.IO, serves static files, verifies JWTs, registers controllers, and starts the server.
- **`server/db.js`** — Opens the SQLite database and applies the schema when the application starts.
- **`server/controllers/auth.controller.js`** — Implements registration and login, validates user input, hashes passwords, verifies credentials, and creates JWTs.
- **`server/controllers/chat.controller.js`** — Implements protected user and message APIs, loads message history, saves new messages, and broadcasts them through Socket.IO.
- **`server/models/schema.sql`** — Defines the `users` and `messages` tables and their relationship.
- **`server/models/chat.db`** — Stores registered users and messages. This file is generated locally and excluded from Git.
- **`server/utils/messages.js`** — Formats message data before it is returned or broadcast.

### Tests and Configuration

- **`test/api.test.js`** — Tests registration, login, JWT authentication, message creation, and message history with a temporary database.
- **`.env.example`** — Provides a safe template for the required environment variables.
- **`package.json`** — Defines the entry point, dependencies, Node.js version, and npm scripts.
- **`package-lock.json`** — Locks dependency versions for reproducible installations.

## Setup Instructions

### Prerequisites

- Node.js 20 or newer
- npm

Check your Node.js version with:

```bash
node --version
```

### GitHub Codespaces

1. Open the project repository on GitHub.
2. Select **Code** > **Codespaces** > **Create codespace on main**.
3. Wait for the Codespace to open, then open a terminal in the project root.
4. Install the exact dependency versions from `package-lock.json`:

   ```bash
   npm ci
   ```

5. Create a local `.env` file from the template:

   ```bash
   cp .env.example .env
   ```

6. Generate a secure secret:

   ```bash
   openssl rand -hex 32
   ```

7. Open `.env` and replace the example `JWT_SECRET` value with the generated secret.
8. Start the application from the project root:

   ```bash
   npm start
   ```

9. When Codespaces detects port `3000`, open the **Ports** panel and select **Open in Browser**.
10. Register an account, log in, and send a message to confirm that the application is working.

### Local Installation

1. Clone the repository and enter the project directory:

   ```bash
   git clone <repository-url>
   cd FSE-Chat-Room
   ```

2. Install the exact dependency versions from the lock file:

   ```bash
   npm ci
   ```

3. Create the environment file:

   **macOS or Linux:**

   ```bash
   cp .env.example .env
   ```

   **Windows PowerShell:**

   ```powershell
   Copy-Item .env.example .env
   ```

4. Open `.env` and replace the example JWT secret with a private value of at least 32 characters.
5. Start the server:

   ```bash
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

There is no separate frontend build step because the client uses plain HTML, CSS, and JavaScript.

For development with automatic server restarts, run:

```bash
npm run dev
```

## Database Setup

This project uses SQLite through `better-sqlite3`, so no separate database server, cloud account, or manual SQL import is required.

When the server starts:

1. `server/db.js` opens the database file.
2. If the file does not exist, SQLite creates `server/models/chat.db` automatically.
3. `server/models/schema.sql` creates the `users` and `messages` tables if necessary.
4. The database is reused after server restarts, so registered users and messages persist.

The generated `chat.db` file is excluded from Git. No database username, password, or connection string is required.

## Environment Variables

Create `.env` from `.env.example`, then update the secret:

```dotenv
JWT_SECRET=replace-with-your-own-private-random-secret
PORT=3000
```

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_SECRET` | Yes | A private value of at least 32 characters used to sign and verify JWTs. |
| `PORT` | No | The server port. Defaults to `3000`. |
| `DATABASE_PATH` | No | A custom SQLite file location. Defaults to `server/models/chat.db`. |

> Never commit the real `.env` file or share its `JWT_SECRET` value.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Starts the application with Node.js. |
| `npm run dev` | Starts the application with automatic restarts through Nodemon. |
| `npm test` | Runs syntax checks and API integration tests. |
| `npm run submission` | Creates the project submission ZIP while excluding local and sensitive files. |

## YouTube Video

[> Add the project demonstration video link here.](https://youtu.be/jOhR9SFdYR0)

