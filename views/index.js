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

document.addEventListener("DOMContentLoaded", async function () {
  debug("DOM content loaded");

  const isLoggedIn = await checkAuthStatus();
  if (!isLoggedIn) {
    window.location.href = "/login.html";
    return;
  }

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

  // Form submission handler
  transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const formData = new FormData(transactionForm);
    const description = formData.get("description");
    const amount = formData.get("amount");
    const date = formData.get("date");
    const category = formData.get("category");
  
    const validationError = validateForm([description, amount, date, category]);
    if (validationError) {
      displayMessage(statusElement, validationError, true);
      debug(`Form validation failed: ${validationError}`);
      return;
    }
  
    try {
      const response = await fetch("/expenses/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          date,
          category_id: parseInt(category),
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        displayMessage(statusElement, "Transaction added successfully", false);
        debug("Transaction added successfully");
        fetchTransactions(); // Refresh the transaction list after adding
        transactionForm.reset();
      } else {
        displayMessage(statusElement, `Error adding transaction: ${data.message}`, true);
        debug(`Error adding transaction: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      displayMessage(statusElement, "Error adding transaction", true);
      debug(`Error adding transaction: ${error.message}`);
    }
  });

  // Edit form submission handler
  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const expenseId = document.getElementById('editExpenseId').value;
    const description = document.getElementById('editDescription').value;
    const amount = document.getElementById('editAmount').value;
    const date = document.getElementById('editDate').value;
    const category = document.getElementById('editCategory').value;

    const validationError = validateForm([description, amount, date, category]);
    if (validationError) {
      displayMessage(statusElement, validationError, true);
      debug(`Form validation failed: ${validationError}`);
      return;
    }

    try {
      const response = await fetch(`/expenses/edit/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          date,
          category_id: parseInt(category)
        })
      });

      const data = await response.json();
      if (response.ok) {
        displayMessage(statusElement, 'Transaction updated successfully', false);
        debug('Transaction updated successfully');
        fetchTransactions();
        editModal.style.display = 'none'; // Close the modal after saving
      } else {
        displayMessage(statusElement, `Error updating transaction: ${data.message}`, true);
        debug(`Error updating transaction: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      displayMessage(statusElement, 'Error updating transaction', true);
      debug(`Error updating transaction: ${error.message}`);
    }
  });

  // Handle delete buttons
  transactionList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
      const expenseId = event.target.dataset.id;
      const confirmDelete = confirm("Are you sure you want to delete this transaction?");
      if (!confirmDelete) return;

      try {
        const response = await fetch(`/expenses/delete/${expenseId}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
          displayMessage(statusElement, 'Transaction deleted successfully', false);
          debug('Transaction deleted successfully');
          fetchTransactions(); // Refresh the transaction list after deletion
        } else {
          displayMessage(statusElement, `Error deleting transaction: ${data.message}`, true);
          debug(`Error deleting transaction: ${data.message}`);
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        displayMessage(statusElement, 'Error deleting transaction', true);
        debug(`Error deleting transaction: ${error.message}`);
      }
    }
  });

  // Handle edit buttons
  transactionList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('edit-btn')) {
      const expenseId = event.target.dataset.id;

      try {
        const response = await fetch(`/expenses/view/${expenseId}`);
        const transaction = await response.json();

        if (response.ok) {
          openEditModal(transaction); // Populate and open the edit modal
          debug('Edit button clicked, modal opened');
        } else {
          displayMessage(statusElement, `Error fetching transaction: ${transaction.message}`, true);
          debug(`Error fetching transaction: ${transaction.message}`);
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
        displayMessage(statusElement, 'Error fetching transaction', true);
        debug(`Error fetching transaction: ${error.message}`);
      }
    }
  });

  // Initially fetch transactions when the page loads
  fetchTransactions();
});
