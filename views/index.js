// Function to check authentication status
async function checkAuthStatus() {
  try {
    const response = await fetch("/auth/status");
    const data = await response.json();
    return response.ok && data.isLoggedIn;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
}

// Debug function for logging messages
function debug(message) {
  console.log(`[CLIENT] ${message}`);
}
// Function to validate form inputs
function validateForm(inputs) {
    for (let input of inputs) {
        if (input === null || input === undefined || input.trim() === '') {
            debug(`Validation failed for field: ${input}`);
            return `Please fill in the required fields.`;
        }
    }
    return null;
}

// Utility function for displaying messages on the UI
function displayMessage(element, message, isError = false) {
    if (element) {
        element.innerText = message;
        element.style.color = isError ? 'red' : 'green';
        debug(`Message displayed: ${message}`);
    } else {
        console.error('Attempted to display a message, but the target element is missing.');
    }
}

document.addEventListener("DOMContentLoaded", function () {
  debug("DOM content loaded");

  const transactionForm = document.getElementById("transactionForm");
  const transactionList = document.getElementById("transactionList");
  const balanceElement = document.getElementById("balance");
  const incomeElement = document.getElementById("income");
  const expenseElement = document.getElementById("expense");
  const statusElement = document.getElementById("status");

  // Get references to modal elements
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const closeBtn = document.querySelector('.close-btn');

  let transactions = [];
  let incomes = [];

  // Function to fetch transactions from the server
  async function fetchTransactions() {
    debug("Fetching transactions from server");

    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      displayMessage(statusElement, "User not logged in", true);
      debug("User not logged in");
      window.location.href = "/login.html"
      return;
    }

    try {
      const response = await fetch("/expenses/view");
      if (response.status === 404) {
        displayMessage(statusElement, "User not logged in", true);
        debug("User not logged in");
        return;
      }
      const data = await response.json();

      if (response.ok) {
        if (data && Array.isArray(data.expenses)) {
          transactions = data.expenses;
          debug(`Fetched ${transactions.length} transactions`);
          updateUI();
        } else {
          displayMessage(
            statusElement,
            "Unexpected server response format",
            true
          );
          debug("Unexpected server response format");
        }
      } else {
        displayMessage(
          `statusElement, Error fetching expenses: ${
            data.message || "Unknown error"
          }, true`
        );
        debug(`Error fetching expenses: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      displayMessage(statusElement, "Error fetching expenses", true);
      debug(`Error fetching expenses: ${error.message}`);
    }

    try {
      const response = await fetch("/incomes/view");
      if (response.status === 404) {
        displayMessage(statusElement, "User not logged in", true);
        debug("User not logged in");
        return;
      }
      const data = await response.json();

      if (response.ok) {
        if (data && Array.isArray(data.budgets)) {
          incomes = data.budgets;
          debug(`Fetched ${incomes.length} incomes`);
          updateUI();
        } else {
          displayMessage(
            statusElement,
            "Unexpected server response format",
            true
          );
          debug("Unexpected server response format");
        }
      } else {
        displayMessage(
          `statusElement, Error fetching incomes: ${
            data.message || "Unknown error"
          }, true`
        );
        debug(`Error fetching incomes: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching incomes:", error);
      displayMessage(statusElement, "Error fetching incomes", true);
      debug(`Error fetching incomes: ${error.message}`);
    }

  }

  // Function to update the UI with current transactions and balances
  function updateUI() {
    debug("Updating UI with current transactions and balances");
    if (
      !transactionList ||
      !balanceElement ||
      !incomeElement ||
      !expenseElement
    ) {
      console.error("UI elements missing");
      return;
    }
  
    transactionList.innerHTML = "";
    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
  
    // Handle incomes
    incomes.forEach((income) => {
      const { budget_id, amount: incomeAmount, description } = income;
      
      const incomeValue = parseFloat(incomeAmount);
      totalIncome += incomeValue;
  
      const incomeElement = document.createElement("li");
      incomeElement.classList.add("income");
      incomeElement.innerHTML = `
        ${description}  +$${incomeValue.toFixed(2)} 
        <!-- <button data-id="${budget_id}" class="edit-income-btn">Edit</button> -->
        <button data-id="${budget_id}" class="delete-income-btn">Delete</button>
      `;
      
      transactionList.appendChild(incomeElement);
    });
    
    // Handle expenses
    transactions.forEach((transaction) => {
      if (transaction && transaction.expense_id) {
        const { expense_id, description, amount } = transaction;
      
        const expenseValue = parseFloat(amount);
        totalExpense += Math.abs(expenseValue);
    
        const expenseElement = document.createElement("li");
        expenseElement.classList.add("expense");
        expenseElement.innerHTML = `
          ${description} -$${Math.abs(expenseValue).toFixed(2)} 
          <button data-id="${expense_id}" class="edit-btn">Edit</button>
          <button data-id="${expense_id}" class="delete-btn">Delete</button>
        `;
      
        transactionList.appendChild(expenseElement);
      } else {
        console.warn('Invalid transaction:', transaction);
      }
    
    });
    
    totalBalance = totalIncome - totalExpense;
    
    // Update UI with the calculated values
    balanceElement.innerText = `$${totalBalance.toFixed(2)}`;
    incomeElement.innerText = `$${totalIncome.toFixed(2)}`;
    expenseElement.innerText = `-$${totalExpense.toFixed(2)}`;
    
    debug("UI updated with new balances");
  }


  // Function to open the edit modal
  function openEditModal(transaction) {
    editForm.innerHTML = `
        <input type="hidden" id="editExpenseId" value="${transaction.expense_id}">
        <div class="form-group">
            <label for="editDescription">Description:</label>
            <input type="text" id="editDescription" value="${transaction.description}" required>
        </div>
        <div class="form-group">
            <label for="editAmount">Amount:</label>
            <input type="number" id="editAmount" value="${transaction.amount}" step="0.01" required>
        </div>
        <div class="form-group">
            <label for="editDate">Date:</label>
            <input type="date" id="editDate" value="${transaction.date}" required>
        </div>
        <div class="form-group">
            <label for="editCategory">Category:</label>
            <select id="editCategory" required>
                ${generateCategoryOptions(transaction.category_id)}
            </select>
        </div>
        <button type="submit">Save Changes</button>
    `;
    editModal.style.display = 'block';
  }

  // Function to generate category options
  function generateCategoryOptions(selectedCategoryId) {
      const categories = [
          { id: 1, name: 'Food' },
          { id: 2, name: 'Transportation' },
          { id: 3, name: 'Housing' },
          { id: 4, name: 'Utilities' },
          { id: 5, name: 'Healthcare' },
          { id: 6, name: 'Entertainment' },
          { id: 7, name: 'Education' },
          { id: 8, name: 'Shopping' },
          { id: 9, name: 'Personal Care' },
          { id: 10, name: 'Debt Payments' },
          { id: 11, name: 'Savings' },
          { id: 12, name: 'Gifts & Donations' },
          { id: 13, name: 'Miscellaneous' }
      ];
      return categories.map(category => 
          `<option value="${category.id}" ${category.id === selectedCategoryId ? 'selected' : ''}>${category.name}</option>`
      ).join('');
  }

  // Close the modal
  closeBtn.onclick = function() {
      editModal.style.display = 'none';
  }

  // Close the modal if clicked outside
  window.onclick = function(event) {
      if (event.target === editModal) {
          editModal.style.display = 'none';
      }
  }

  // Handle form submission for adding a new transaction
  transactionForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    debug("Submitting new transaction");

    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      displayMessage(statusElement, "User not logged in", true);
      debug("User not logged in");
      return;
    }

    // Check which option is selected (Expense or Income)
    const isExpense = !document.getElementById("type").checked;
    
    if (!isExpense){
      debug(`Transaction type: ${isExpense ? "Expense" : "Income"}`);
      return;
    } 

    const formData = new FormData(transactionForm);
    const amount = parseFloat(formData.get("amount") || "0");
    const date = formData.get("date") || "";
    const description = formData.get("description") || "";
    const category_id = parseInt(formData.get("category_id") || "0");

    const validationError = validateForm([amount.toString(), date, description]);
    if (validationError) {
        displayMessage(statusElement, validationError, true);
        debug(`Form validation failed: ${validationError}`);
        return;
    }

    const newExpense = { amount, date, description, category_id };

    try {
      const response = await fetch("/expenses/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });
      const data = await response.json();

      if (response.ok) {
        transactions.push(data.expense);
        fetchTransactions();
        updateUI();
        transactionForm.reset();
        displayMessage(statusElement, "Expense added successfully");
        debug("New transaction added successfully");
      } else {
        displayMessage(`statusElement, Error: ${data.message}, true`);
        debug(`Error adding transaction: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      displayMessage(statusElement, "Error adding expense", true);
      debug(`Error adding transaction: ${error.message}`);
    }
  });

  // Handle form submission for adding a new income
  transactionForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    debug("Submitting new transaction");

    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      displayMessage(statusElement, "User not logged in", true);
      debug("User not logged in");
      return;
    }

    const formData = new FormData(transactionForm);

    // Check which option is selected (Expense or Income)
    const isExpense = !document.getElementById("type").checked;
    
    if (isExpense){
      debug(`Transaction type: ${isExpense ? "Expense" : "Income"}`);
      return;
    } 

    const amount = parseFloat(formData.get("amount") || "0");
    const start_date = formData.get("date") || "";
    const end_date = formData.get("date") || "";
    const description = formData.get("description") || "";
    const category_id = parseInt(formData.get("category_id") || "0");
    const newIncome = { amount, start_date, end_date, description, category_id };

    try {
      const response = await fetch("/incomes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIncome),
      });
      const data = await response.json();

      if (response.ok) {
        transactions.push(data.expense);
        fetchTransactions();
        updateUI();
        transactionForm.reset();
        displayMessage(statusElement, "Incomes added successfully");
        debug("New incomes added successfully");
      } else {
        displayMessage(`statusElement, Error: ${data.message}, true`);
        debug(`Error adding transaction: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding income:", error);
      displayMessage(statusElement, "Error adding income", true);
      debug(`Error adding transaction: ${error.message}`);
    }
  });

  // Handle editing of a transaction
  transactionList?.addEventListener('click', async function (e) {
    if (e.target.classList.contains('edit-btn')) {
        debug('Editing transaction');

        const isLoggedIn = await checkAuthStatus();
        if (!isLoggedIn) {
            displayMessage(statusElement, 'User not logged in', true);
            debug('User not logged in');
            return;
        }

        // Convert the expenseId to a number if it's stored as a number in the transactions array
        const expenseId = Number(e.target.getAttribute('data-id'));
        const transactionToEdit = transactions.find(t => t.expense_id === expenseId);

        if (transactionToEdit) {
            openEditModal(transactionToEdit);
        } else {
            displayMessage(statusElement, 'Transaction not found', true);
            debug('Transaction not found');
        }
    }
  });

  // Handle form submission for editing a transaction
  editForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      debug('Submitting edited transaction');

      const isLoggedIn = await checkAuthStatus();
          if (!isLoggedIn) {
              displayMessage(statusElement, 'User not logged in', true);
              debug('User not logged in');
              return;
          }

      const expenseId = document.getElementById('editExpenseId').value;
      const newAmount = parseFloat(document.getElementById('editAmount').value);
      const newDate = document.getElementById('editDate').value;
      const newDescription = document.getElementById('editDescription').value;
      const newCategoryId = parseInt(document.getElementById('editCategory').value);

      const validationError = validateForm([newAmount.toString(), newDate, newDescription, newCategoryId.toString()]);
      if (validationError) {
          displayMessage(statusElement, validationError, true);
          debug(`Form validation failed: ${validationError}`);
          return;
      }

      const editedExpense = { 
          expense_id: expenseId,
          amount: newAmount, 
          date: newDate, 
          description: newDescription, 
          category_id: newCategoryId 
      };

      try {
          const response = await fetch(`/expenses/edit`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(editedExpense)
          });

          if (response.ok) {
              const updatedExpense = await response.json();
              transactions = transactions.map(t => t.expense_id === expenseId ? updatedExpense : t);
              fetchTransactions();
              updateUI();
              editModal.style.display = 'none';
              displayMessage(statusElement, 'Expense updated successfully');
              debug('Transaction updated successfully');
          } else {
              const data = await response.json();
              displayMessage(statusElement, `Error: ${data.message}`, true);
              debug(`Error updating transaction: ${data.message}`);
          }
      } catch (error) {
          console.error('Error updating expense:', error);
          displayMessage(statusElement, 'Error updating expense', true);
          debug(`Error updating transaction: ${error.message}`);
      }
  });

  // Handle deletion of a transaction
  transactionList?.addEventListener('click', async function (e) {
    if (e.target.classList.contains('delete-btn')) {
        debug('Deleting transaction');

        const isLoggedIn = await checkAuthStatus();
        if (!isLoggedIn) {
            displayMessage(statusElement, 'User not logged in', true);
            debug('User not logged in');
            return;
        }

        const expenseId = e.target.getAttribute('data-id');

        if (!confirm('Are you sure you want to delete this transaction?')) {
            debug('Deletion canceled by user');
            return;
        }

        try {
            const response = await fetch('/expenses/delete',{ 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id: expenseId})
            });

            if (response.ok) {
                transactions = transactions.filter(transaction => transaction.expense_id !== expenseId);
                fetchTransactions(); 
                updateUI();
                transactionForm.reset();
                displayMessage(statusElement, 'Expense deleted successfully');
                debug('Transaction deleted successfully');
            } else {
                const data = await response.json();
                displayMessage(statusElement, `Error: ${data.message}`, true);
                debug(`Error deleting transaction: ${data.message}`);
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            displayMessage(statusElement, 'Error deleting expense', true);
            debug(`Error deleting transaction: ${error.message}`);
        }
      }
  });

  // Handle deletion of an income
  transactionList?.addEventListener('click', async function (e) {
    if (e.target.classList.contains('delete-income-btn')) {
        debug('Deleting income');

        const isLoggedIn = await checkAuthStatus();
        if (!isLoggedIn) {
            displayMessage(statusElement, 'User not logged in', true);
            debug('User not logged in');
            return;
        }

        const incomeId = e.target.getAttribute('data-id');

        if (!confirm('Are you sure you want to delete this income?')) {
            debug('Deletion canceled by user');
            debug(incomeId);
            return;
        }

        try {
            const response = await fetch('/incomes/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id: incomeId})
            });

            if (response.ok) {
                incomes = incomes.filter(income => income.budget_id !== incomeId);
                fetchTransactions(); 
                updateUI();
                transactionForm.reset();
                displayMessage(statusElement, 'Income deleted successfully');
                debug('Income deleted successfully');
            } else {
                const data = await response.json();
                displayMessage(statusElement, `Error: ${data.message}`, true);
                debug(`Error deleting income: ${data.message}`);
            }
        } catch (error) {
            console.error('Error deleting income:', error);
            displayMessage(statusElement, 'Error deleting income', true);
            debug(`Error deleting income: ${error.message}`);
        }
    }
  });

  fetchTransactions();
});
