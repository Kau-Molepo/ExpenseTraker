const Expense = require('../models/Expense');
const db = require('../config/db');

exports.addExpense = (req, res) => {
    const { amount, date, description, category_id } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!amount || !date || !description || !category_id) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    Expense.create(userId, category_id, amount, date, description, (err, result) => {
        if (err) {
            console.error('Error adding expense:', err);  // Log the error for debugging
            return res.status(500).json({ message: 'Error adding expense' });
        }
        res.status(201).json({ message: 'Expense added successfully', expense: result });
    });
};


exports.viewExpenses = (req, res) => {
    const userId = req.session.userId;

    // Query to get expenses for the user
    const query = 'SELECT * FROM Expenses WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            // Error while querying the database
            console.error('Error fetching expenses:', err);
            return res.status(500).json({ message: 'Error fetching expenses' });
        }

        // Respond with expenses wrapped in an object
        res.status(200).json({ expenses: results });
    });
};

exports.editExpense = (req, res) => {
    const { expense_id, category_id, amount, date, description } = req.body;

    Expense.update(expense_id, category_id, amount, date, description, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error updating expense' });
        res.status(200).json({ message: 'Expense updated successfully' });
    });
};

exports.deleteExpense = (req, res) => {
    const { id } = req.body;

    Expense.delete(id, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error deleting expense' });
        res.status(200).json({ message: 'Expense deleted successfully' });
    });
};
