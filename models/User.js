const db = require('../config/db');

const User = {
    create: (username, email, hashedPassword, callback) => {
        const query = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], callback);
    },
    findByUsername: (username, callback) => {
        const query = 'SELECT * FROM Users WHERE username = ?';
        db.query(query, [username], callback);
    }
};

module.exports = User;