const db = require('../config/db');

const Expense = {
    create: (userId, category_id, amount, date, description, callback) => {
        const query = 'INSERT INTO Expenses (user_id, category_id, amount, date, description) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [userId, category_id, amount, date, description], callback);
    },
    findByUserId: (userId, callback) => {
        const query = 'SELECT * FROM Expenses WHERE user_id = ?';
        db.query(query, [userId], callback);
    },
    update: (expense_id, category_id, amount, date, description, callback) => {
        const query = 'UPDATE Expenses SET category_id = ?, amount = ?, date = ?, description = ? WHERE expense_id = ?';
        db.query(query, [category_id, amount, date, description, expense_id], callback);
    },
    delete: (expenseId, callback) => {
        const query = 'DELETE FROM Expenses WHERE expense_id = ?';
        db.query(query, [expenseId], callback);
    }
};

module.exports = Expense;