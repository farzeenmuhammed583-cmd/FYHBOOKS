(function() {
    const USERS_KEY = "khata_users";
    const CURRENT_USER_KEY = "currentUser";

    function getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isPasswordStrong(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[!@#$%^&*()]/.test(password);

        if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
            return false;
        }
        return true;
    }

    function signupUser(event) {
        event.preventDefault();

        let name = document.getElementById("name").value.trim();
        let email = document.getElementById("email").value.trim().toLowerCase();
        let password = document.getElementById("password").value.trim();

        if (!name || !email || !password) {
            alert("Please fill all fields");
            return;
        }

        if (!isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (!isPasswordStrong(password)) {
            alert("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols.");
            return;
        }

        let users = getUsers();
        let exists = users.find(u => u.email === email);

        if (exists) {
            alert("User already exists");
            return;
        }

        // In a real application, you would hash the password before saving it.
        // For example, using a library like bcrypt:
        // const saltRounds = 10;
        // bcrypt.hash(password, saltRounds, function(err, hash) {
        //     if (err) {
        //         console.error("Error hashing password:", err);
        //         alert("Error creating account. Please try again.");
        //         return;
        //     }
        //     users.push({ name, email, password: hash });
        //     saveUsers(users);
        //     alert("Account created successfully");
        //     setTimeout(() => {
        //         window.location.href = "login.html";
        //     }, 1500);
        // });

        users.push({ name, email, password }); // Storing password in plaintext for now
        saveUsers(users);

        alert("Account created successfully");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    }

    function loginUser(event) {
        event.preventDefault();

        let email = document.getElementById("email").value.trim().toLowerCase();
        let password = document.getElementById("password").value.trim();

        let users = getUsers();
        let user = users.find(u => u.email === email);

        if (!user) {
            alert("No account found");
            return;
        }

        // In a real application, you would compare the entered password with the stored hash.
        // For example, using bcrypt:
        // bcrypt.compare(password, user.password, function(err, result) {
        //     if (result) {
        //         localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        //         window.location = "dashboard.html";
        //     } else {
        //         alert("Wrong password");
        //     }
        // });

        if (user.password !== password) {
            alert("Wrong password");
            return;
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        localStorage.removeItem("khata_current_user");
        window.location.href = "dashboard.html";
    }

    function getCurrentUser() {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    }

    function logoutUser() {
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
    }

    document.addEventListener("DOMContentLoaded", () => {
        let signupForm = document.getElementById("signupForm");
        if (signupForm) {
            signupForm.addEventListener("submit", signupUser);
        }

        let loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", loginUser);
        }
    });
})();
