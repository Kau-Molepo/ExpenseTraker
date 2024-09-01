const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/incomes');
const path = require('path');
require('dotenv').config();

const app = express();

// Enhanced debug function
function debug(message, details = {}) {
    console.log(`[SERVER] ${message}`, JSON.stringify(details, null, 2));
}

// MySQL session store options
const sessionStoreOptions = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 60000*5, // 1 minute*5 = 5 minutes   //Session Cleanup: Expired sessions are checked and removed every 5 minutes
    expiration: 60000*15, // 1 minute*15 = 15 minutes    //  Session Inactivity Expiration: The session will expire after 15 minutes of inactivity. 
};

// Create a session store
const sessionStore = new MySQLStore(sessionStoreOptions);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up session middleware with MySQL store
app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // set secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours  // Session Cookie Expiration: The session will expire after 24 hours if the user doesn't log out.
    }
}));

// Enhanced middleware for logging requests
app.use((req, res, next) => {
    debug(`Received ${req.method} request for ${req.url}`, {
        headers: req.headers,
        query: req.query,
        body: req.body
    });

    // Log response
    const originalJson = res.json;
    res.json = function(body) {
        debug(`Sending response for ${req.method} ${req.url}`, {
            statusCode: res.statusCode,
            body: body
        });
        originalJson.call(this, body);
    };

    next();
});

// Handle favicon.ico request
app.get('/favicon.ico', (req, res) => {
    debug('Handling favicon.ico request');
    res.status(204).end();
});

// Route for authentication
app.use('/auth', (req, res, next) => {
    debug('Entering auth route');
    next();
}, authRoutes);

// Route for expenses
app.use('/expenses', (req, res, next) => {
    debug('Entering expenses route, Session:', req.session);
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
}, expenseRoutes);

// Route for incomes
app.use('/incomes', (req, res, next) => {
    debug('Entering incomes route, Session:', req.session);
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
}, incomeRoutes);

// Default home page (login page)
app.get('/', (req, res) => {
    debug('Serving login page');
    res.sendFile(path.join(__dirname, './views', 'login.html'));
});

// Serve static files (e.g., CSS, HTML)
app.use(express.static(path.join(__dirname, './views')));

// Handle 404 errors
app.use((req, res) => {
    debug(`404 error: ${req.method} request for ${req.url} not found`);
    res.status(404).send('Page not found');
});

module.exports = app;
