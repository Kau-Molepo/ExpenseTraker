document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form')
    

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
       
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const authMsg = document.getElementById('auth-msg');


        try{
            const response = await fetch('auth/login', {
                method: 'POST',
                headers:  {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if(!response.ok) {
                authMsg.textContent = "Invalid username or password!"
            } else {
                authMsg.textContent = "Login successful"
                window.location.href = "/index.html"
                return;
            }
    

        } catch (err) {
            authMsg.textContent = 'An error occured'
        }
    })

})