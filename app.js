const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/incomes')
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

// Handle favicon.ico request
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });

// Route for authentication
app.use('/auth', authRoutes);

// Route for expenses
app.use('/expenses', expenseRoutes);

// Route for Income
app.use('/incomes', incomeRoutes);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    debug(`Server running at http://localhost:${PORT}`);
});

module.exports = app