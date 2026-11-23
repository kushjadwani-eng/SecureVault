// SecureVault Authentication Client

function showAlert(elementId, message, isError = true) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.className = 'alert ' + (isError ? 'alert-error' : 'alert-success');
}

function clearAlert(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = 'none';
}

// Toggle password visibility
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

// Handle User Registration
async function handleRegister(e) {
    e.preventDefault();
    clearAlert('alertBox');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password) {
        showAlert('alertBox', 'Please complete all required fields.');
        return;
    }

    if (password.length < 8) {
        showAlert('alertBox', 'Master password must be at least 8 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('alertBox', 'Passwords do not match. Please re-enter.');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account (Hashing Argon2id)...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert('alertBox', 'Registration successful! Redirecting to login...', false);
            setTimeout(() => {
                window.location.href = '/login';
            }, 1200);
        } else {
            showAlert('alertBox', data.error || 'Failed to register account.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Master Account';
        }
    } catch (err) {
        showAlert('alertBox', 'Network or server error: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Master Account';
    }
}

// Handle User Login
async function handleLogin(e) {
    e.preventDefault();
    clearAlert('alertBox');

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showAlert('alertBox', 'Please enter your email and master password.');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying & Unlocking Vault...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Save token and user details to localStorage as fallback
            if (data.token) localStorage.setItem('sv_token', data.token);
            if (data.user) localStorage.setItem('sv_user', JSON.stringify(data.user));

            showAlert('alertBox', 'Vault unlocked! Opening dashboard...', false);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 800);
        } else {
            showAlert('alertBox', data.error || 'Invalid email or master password.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Unlock Vault';
        }
    } catch (err) {
        showAlert('alertBox', 'Server connection error: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Unlock Vault';
    }
}

// Handle Logout
async function handleLogout() {
    try {
        const token = localStorage.getItem('sv_token');
        await fetch('/api/logout', {
            method: 'POST',
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
    } catch (e) {
        console.error('Logout error:', e);
    } finally {
        localStorage.removeItem('sv_token');
        localStorage.removeItem('sv_user');
        window.location.href = '/login';
    }
}

// Check session on page load
async function checkAuth(requireAuth = true) {
    const token = localStorage.getItem('sv_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

    try {
        const res = await fetch('/api/auth/me', { headers });
        if (res.ok) {
            const data = await res.json();
            if (!requireAuth) {
                // If on login/register and already logged in, redirect to dashboard
                window.location.href = '/dashboard';
            }
            return data.user;
        } else {
            if (requireAuth) {
                window.location.href = '/login';
            }
            return null;
        }
    } catch (e) {
        if (requireAuth) {
            window.location.href = '/login';
        }
        return null;
    }
}
