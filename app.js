const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const path = require('path');
require('dotenv').config();

const app = express();

// Debug function
function debug(message) {
    console.log(`[SERVER] ${message}`);
}

// Middleware for logging requests
app.use((req, res, next) => {
    debug(`${req.method} request for ${req.url}`);
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Route for authentication
app.use('/auth', authRoutes);

// Route for expenses
app.use('/expenses', expenseRoutes);

// Default home page (login page)
app.get('/', (req, res) => {
    debug('Serving login page');
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Serve static files (e.g., CSS, HTML)
app.use(express.static(path.join(__dirname, 'views')));

// Handle 404 errors
app.use((req, res) => {
    debug(`404 error: ${req.method} request for ${req.url} not found`);
    res.status(404).send('Page not found');
});

app.use((req, res, next) => {
    debug(`Request URL: ${req.url}`);
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    debug(`Server running at http://localhost:${PORT}`);
});

