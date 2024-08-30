const db = require('../config/db');

const Income = {
    create: (userId, description, category_id, amount, start_date, end_date, callback) => {
        const query = 'INSERT INTO Budgets ( user_id, description, category_id, amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [ userId, description, category_id, amount, start_date, end_date], callback);
    },
    findByUserId: (userId, callback) => {
        const query = 'SELECT * FROM Budgets WHERE user_id = ?';
        db.query(query, [userId], callback);
    },
    delete: (budget_id, callback) => {
        const query = 'DELETE FROM Budgets WHERE budget_id = ?';
        db.query(query, [budget_id], callback);
    }
};

module.exports = Income;