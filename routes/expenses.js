const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.post('/add', expenseController.addExpense);
router.get('/view', expenseController.viewExpenses);
router.put('/edit', expenseController.editExpense);
router.delete('/delete', expenseController.deleteExpense);

module.exports = router;