const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

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
    debug('Entering expenses route');
    next();
}, expenseRoutes);

// Route for Income
app.use('/incomes', (req, res, next) => {
    debug('Entering incomes route');
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

const PORT = process.env.PORT || 3000;  // Changed from DB_PORT to PORT

app.listen(PORT, () => {
    debug(`Server running at http://localhost:${PORT}`, {
        env: process.env.NODE_ENV,
        port: PORT
    });
});

module.exports = app;