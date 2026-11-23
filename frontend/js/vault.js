// SecureVault Vault Management Client

let allEntries = [];
let currentFilter = 'All';
let editingEntryId = null;

// Initialize Dashboard
async function initDashboard() {
    const user = await checkAuth(true);
    if (!user) return;

    document.getElementById('userNameDisplay').textContent = user.name;
    document.getElementById('userEmailDisplay').textContent = user.email;

    loadVaultEntries();
}

// Load all vault entries from authenticated API
async function loadVaultEntries() {
    const token = localStorage.getItem('sv_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

    try {
        const res = await fetch('/api/vault', { headers });
        if (res.ok) {
            const data = await res.json();
            allEntries = data.entries || [];
            updateStats();
            renderEntries();
        } else if (res.status === 401) {
            window.location.href = '/login';
        }
    } catch (err) {
        console.error('Error fetching vault:', err);
    }
}

// Update dashboard overview stats
function updateStats() {
    const totalCount = allEntries.length;
    document.getElementById('statTotalCount').textContent = totalCount;

    // Unique categories
    const categories = new Set(allEntries.map(e => e.category || 'Personal'));
    document.getElementById('statCategoryCount').textContent = categories.size;

    // Basic Vault Health: check for passwords >= 12 chars
    const strongCount = allEntries.filter(e => e.password && e.password.length >= 12).length;
    const healthPercent = totalCount === 0 ? 100 : Math.round((strongCount / totalCount) * 100);
    document.getElementById('statHealth').textContent = healthPercent + '%';
}

// Render entries to the DOM
function renderEntries() {
    const container = document.getElementById('vaultListContainer');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    // Filter by category and search
    const filtered = allEntries.filter(entry => {
        const matchesCategory = (currentFilter === 'All' || entry.category === currentFilter);
        const matchesSearch = 
            (entry.website && entry.website.toLowerCase().includes(searchQuery)) ||
            (entry.username && entry.username.toLowerCase().includes(searchQuery)) ||
            (entry.website_url && entry.website_url.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <h3>No Credentials Found</h3>
                <p>${allEntries.length === 0 ? 'Your vault is currently empty. Add your first password below!' : 'No entries match your search or filter criteria.'}</p>
                <button class="btn btn-primary" style="width: auto; margin: 0 auto;" onclick="openAddModal()">
                    + Add New Credential
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(entry => {
        const initial = (entry.website ? entry.website.charAt(0).toUpperCase() : '?');
        const safeWebsite = escapeHtml(entry.website);
        const safeUrl = escapeHtml(entry.website_url || '');
        const safeUsername = escapeHtml(entry.username || '');
        const safeCategory = escapeHtml(entry.category || 'Personal');
        const entryId = entry.entry_id;

        return `
            <div class="vault-item" id="entry-${entryId}">
                <div class="item-main">
                    <div class="item-icon">${initial}</div>
                    <div class="item-details">
                        <div class="item-title-row">
                            <span class="item-title">${safeWebsite}</span>
                            <span class="item-badge">${safeCategory}</span>
                        </div>
                        <div class="item-subtext">
                            ${safeUrl ? `<a href="${safeUrl.startsWith('http') ? safeUrl : 'https://' + safeUrl}" target="_blank" rel="noopener" style="color: var(--text-muted); text-decoration: none;">🔗 ${safeUrl}</a> &bull; ` : ''}
                            <span>Updated: ${entry.updated_at ? entry.updated_at.split(' ')[0] : 'Today'}</span>
                        </div>
                    </div>
                </div>

                <div class="item-credentials">
                    <div class="credential-field" title="Username">
                        <span>👤 ${safeUsername || '—'}</span>
                        ${safeUsername ? `<button class="btn-icon" onclick="copyToClipboard('${escapeJs(entry.username)}', this)" title="Copy Username">📋</button>` : ''}
                    </div>

                    <div class="credential-field" title="Password">
                        <span id="pwd-text-${entryId}" class="password-masked">••••••••••••</span>
                        <button class="btn-icon" onclick="togglePasswordReveal(${entryId})" title="Reveal Password">👁️</button>
                        <button class="btn-icon" onclick="copyPassword(${entryId}, this)" title="Copy Password">📋</button>
                    </div>
                </div>

                <div class="item-actions">
                    <button class="btn-icon" onclick="openEditModal(${entryId})" title="Edit Entry">✏️</button>
                    <button class="btn-icon" style="color: var(--danger);" onclick="deleteEntry(${entryId})" title="Delete Entry">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Reveal / Hide password in list
function togglePasswordReveal(entryId) {
    const textEl = document.getElementById(`pwd-text-${entryId}`);
    const entry = allEntries.find(e => e.entry_id === entryId);
    if (!textEl || !entry) return;

    if (textEl.classList.contains('password-masked')) {
        textEl.textContent = entry.password;
        textEl.classList.remove('password-masked');
    } else {
        textEl.textContent = '••••••••••••';
        textEl.classList.add('password-masked');
    }
}

// Copy password to clipboard
function copyPassword(entryId, btn) {
    const entry = allEntries.find(e => e.entry_id === entryId);
    if (!entry) return;
    copyToClipboard(entry.password, btn);
}

// Generic copy helper
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const oldText = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = oldText; }, 1200);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

// Filter selection
function setFilter(category, pillEl) {
    currentFilter = category;
    document.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
    pillEl.classList.add('active');
    renderEntries();
}

// Modal handling
function openAddModal() {
    editingEntryId = null;
    document.getElementById('modalTitle').textContent = 'Add New Credential';
    document.getElementById('modalForm').reset();
    document.getElementById('modalAlert').style.display = 'none';
    document.getElementById('credentialModal').classList.add('open');
}

function openEditModal(entryId) {
    const entry = allEntries.find(e => e.entry_id === entryId);
    if (!entry) return;

    editingEntryId = entryId;
    document.getElementById('modalTitle').textContent = 'Edit Credential';
    document.getElementById('modalAlert').style.display = 'none';

    document.getElementById('entryWebsite').value = entry.website || '';
    document.getElementById('entryUrl').value = entry.website_url || '';
    document.getElementById('entryUsername').value = entry.username || '';
    document.getElementById('entryPassword').value = entry.password || '';
    document.getElementById('entryCategory').value = entry.category || 'Personal';

    document.getElementById('credentialModal').classList.add('open');
}

function closeModal() {
    document.getElementById('credentialModal').classList.remove('open');
}

// Save Entry (Create or Update)
async function handleSaveEntry(e) {
    e.preventDefault();
    const alertBox = document.getElementById('modalAlert');
    alertBox.style.display = 'none';

    const website = document.getElementById('entryWebsite').value.trim();
    const website_url = document.getElementById('entryUrl').value.trim();
    const username = document.getElementById('entryUsername').value.trim();
    const password = document.getElementById('entryPassword').value;
    const category = document.getElementById('entryCategory').value;

    if (!website || !password) {
        alertBox.textContent = 'Website name and password are required.';
        alertBox.style.display = 'block';
        alertBox.className = 'alert alert-error';
        return;
    }

    const token = localStorage.getItem('sv_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };

    const payload = { website, website_url, username, password, category };
    const method = editingEntryId ? 'PUT' : 'POST';
    const url = editingEntryId ? `/api/vault/${editingEntryId}` : '/api/vault';

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            closeModal();
            loadVaultEntries();
        } else {
            alertBox.textContent = data.error || 'Failed to save credential.';
            alertBox.style.display = 'block';
            alertBox.className = 'alert alert-error';
        }
    } catch (err) {
        alertBox.textContent = 'Network error: ' + err.message;
        alertBox.style.display = 'block';
        alertBox.className = 'alert alert-error';
    }
}

// Delete Entry
async function deleteEntry(entryId) {
    const entry = allEntries.find(e => e.entry_id === entryId);
    const name = entry ? entry.website : 'this credential';
    if (!confirm(`Are you sure you want to permanently delete ${name}?`)) {
        return;
    }

    const token = localStorage.getItem('sv_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

    try {
        const res = await fetch(`/api/vault/${entryId}`, {
            method: 'DELETE',
            headers
        });

        if (res.ok) {
            loadVaultEntries();
        } else {
            alert('Failed to delete entry.');
        }
    } catch (err) {
        alert('Network error deleting entry: ' + err.message);
    }
}

// Cryptographically secure password generator in browser
function generateStrongPassword() {
    const length = 18;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }

    const pwdField = document.getElementById('entryPassword');
    if (pwdField) {
        pwdField.value = password;
        pwdField.type = 'text';
    }
}

// Utilities
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
}

function escapeJs(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Start
document.addEventListener('DOMContentLoaded', initDashboard);
