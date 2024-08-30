const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.post('/add', expenseController.addIncome);
router.get('/view', expenseController.viewIncomes);
router.delete('/delete', expenseController.deleteIncome)

module.exports = router;