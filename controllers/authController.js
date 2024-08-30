const bcrypt = require('bcryptjs');
const User = require('../models/User');
const db = require('../config/db'); // Ensure this module is properly set up for executing SQL queries

exports.register = (req, res) => {
    const { username, email, password } = req.body;

    console.log('[REGISTER] Received registration data:', { username, email });

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('[REGISTER] Error hashing password:', err);
            return res.status(500).json({ message: 'Error hashing password' });
        }

        console.log('[REGISTER] Password hashed successfully');

        User.create(username, email, hashedPassword, (err, result) => {
            if (err) {
                console.error('[REGISTER] Error creating user:', err);
                return res.status(500).json({ message: 'Error creating user' });
            }

            const userId = result.insertId; // Retrieve the ID of the newly created user
            console.log('[REGISTER] User registered successfully:', result);

            // Insert default categories
            const categories = [
                'Food', 'Transportation', 'Housing', 'Utilities', 'Healthcare',
                'Entertainment', 'Education', 'Shopping', 'Personal Care', 'Debt Payments',
                'Savings', 'Gifts & Donations', 'Miscellaneous'
            ];

            const categoryQueries = categories.map(category => {
                return new Promise((resolve, reject) => {
                    const query = 'INSERT INTO Categories (user_id, category_name) VALUES (?, ?)';
                    db.query(query, [userId, category], (err, result) => {
                        if (err) {
                            console.error('[REGISTER] Error adding category:', err);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });

            Promise.all(categoryQueries)
                .then(() => {
                    res.status(201).json({ message: 'User and default categories registered successfully' });
                })
                .catch((err) => {
                    console.error('[REGISTER] Error adding default categories:', err);
                    res.status(500).json({ message: 'Error adding default categories' });
                });
        });
    });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    console.log('[LOGIN] Attempting login for user:', username);

    User.findByUsername(username, (err, users) => {
        if (err) {
            console.error('[LOGIN] Error finding user in database:', err);
            return res.status(500).json({ message: 'Error finding user' });
        }
        if (users.length === 0) {
            console.warn('[LOGIN] User not found or password mismatch for username:', username);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = users[0];
        console.log('[LOGIN] User found:', user);

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('[LOGIN] Error during password comparison:', err);
                return res.status(500).json({ message: 'Error comparing passwords' });
            }
            if (!isMatch) {
                console.warn('[LOGIN] Password mismatch for user:', username);
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            req.session.userId = user.user_id;  // Set the userId in the session
            req.session.save(err => {
                if (err) {
                    console.error('[LOGIN] Error saving session:', err);
                    return res.status(500).json({ message: 'Error saving session' });
                }
                console.log('[LOGIN] Session object after save:', req.session);
                console.log('[LOGIN] Login successful for user:', username);
                res.status(200).redirect('/expenses/view');
            });
        });
    });
};



exports.logout = (req, res) => {
    console.log('[LOGOUT] User logging out:', req.session.userId);
    req.session.destroy(err => {
        if (err) {
            console.error('[LOGOUT] Error destroying session:', err);
            return res.status(500).json({ message: 'Error logging out' });
        }
        console.log('[LOGOUT] Logout successful');
        res.status(200).json({ message: 'Logout successful' });
    });
};

exports.status = (req, res) => {
    console.log('[STATUS] Session Object:', req.session);
    console.log('[STATUS] User ID:', req.session.userId);
    
    if (req.session.userId) {
        res.status(200).json({ message: "User verified", isLoggedIn: true });
    } else {
        res.status(404).json({ message: 'User not logged in', isLoggedIn: false });
    }
};