// Debug function
function debug(message) {
    console.log(`[CLIENT] ${message}`);
}

// Utility function for displaying messages
function displayMessage(message, isError = false) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.innerText = message;
        messageElement.className = isError ? 'error' : 'success';
        messageElement.style.display = 'block';
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
        debug(`Message displayed: ${message}`);
    } else {
        console.error('Attempted to display a message, but the target element is missing.');
    }
}

// Validate form inputs
function validateForm(inputs) {
    for (let input of inputs) {
        if (input === null || input === undefined || input.trim() === '') {
            debug(`Validation failed for field: ${input}`);
            return `Please fill in all required fields.`;
        }
    }
    return null;
}

document.addEventListener('DOMContentLoaded', function () {
    debug('DOM content loaded');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Handle login form submission
    loginForm?.addEventListener('submit', async function (e) {
        e.preventDefault();
        debug('Submitting login form');

        const formData = new FormData(loginForm);
        const username = formData.get('username') || '';
        const password = formData.get('password') || '';

        const validationError = validateForm([username, password]);
        if (validationError) {
            displayMessage(validationError, true);
            debug(`Login form validation failed: ${validationError}`);
            return;
        }

        const loginData = { username, password };

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            const data = await response.json();

            if (response.ok) {
                displayMessage('Login successful');
                debug('Login successful');
                window.location.href = '/index.html'; // Redirect to the home page
            } else {
                displayMessage(`Error: ${data.message}`, true);
                debug(`Login error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error logging in:', error);
            displayMessage('Error logging in', true);
            debug(`Login error: ${error.message}`);
        }
    });

    // Handle registration form submission
    registerForm?.addEventListener('submit', async function (e) {
        e.preventDefault();
        debug('Submitting registration form');

        const formData = new FormData(registerForm);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        const validationError = validateForm([username, email, password]);
        if (validationError) {
            displayMessage(validationError, true);
            debug(`Registration form validation failed: ${validationError}`);
            return;
        }

        const registerData = { username, email, password };

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            });
            const data = await response.json();

            if (response.ok) {
                displayMessage('Registration successful');
                debug('Registration successful');
                window.location.href = '/login.html'; // Redirect to login page
            } else {
                displayMessage(`Error: ${data.message}`, true);
                debug(`Registration error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            displayMessage('Error during registration', true);
            debug(`Registration error: ${error.message}`);
        }
    });
});