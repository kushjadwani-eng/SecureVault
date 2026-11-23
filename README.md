# 🛡️ SecureVault — Personal Encrypted Password Manager

> A modern, beginner-friendly personal password manager built with a **C++ backend** and a **browser-based web interface**.

---

## 📖 Project Overview

**SecureVault** is an engineering project demonstrating full-stack C++ application development, cryptography fundamentals, database persistence, and clean web interface design.

Users can securely register an account, unlock their personal vault with a master password, and manage website credentials with authenticated end-to-end encryption.

### Key Capabilities
* **Master Account Authentication**: Protected with industry-standard **Argon2id** password hashing.
* **Encrypted Credential Storage**: Sensitive website passwords are encrypted using **XChaCha20-Poly1305** authenticated encryption.
* **Per-User Isolation**: Strict server-side ownership enforcement—users can only access and modify their own credentials.
* **Persistent Storage**: Lightweight, robust local database using **SQLite** with Write-Ahead Logging (WAL) and foreign keys enabled.
* **Interactive Web Dashboard**: Modern dark-mode interface with instant search, category filtering, password generator, strength indicators, and click-to-copy convenience.

---

## 🏗️ Architecture

SecureVault follows a clean **Three-Layer Architecture**:

```
┌────────────────────────────────────────────────────────┐
│                   Web Frontend                         │
│   (HTML5, CSS3, Vanilla JavaScript, Fetch API)         │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP JSON / REST
┌───────────────────────────▼────────────────────────────┐
│                   C++ Backend                          │
│   • Crow C++ Microframework (HTTP & Route Routing)     │
│   • Session & Authentication Management                │
│   • Cryptographic Service (Argon2id + XChaCha20)       │
│   • Parameterized SQLite Data Access Layer             │
└───────────────────────────▲────────────────────────────┘
                            │ SQL Prepared Statements
┌───────────────────────────▼────────────────────────────┐
│                   SQLite Database                      │
│   (Users & VaultEntries Tables in securevault.db)      │
└────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Engineering

1. **Master Password Protection**:
   * Plaintext master passwords are **never stored** anywhere on disk or in the database.
   * Uses **Argon2id** (`crypto_pwhash_str`) with interactive memory and CPU hardness parameters, providing resistance against GPU/ASIC brute-force attacks.
2. **Authenticated Symmetric Encryption**:
   * Uses **XChaCha20-Poly1305** AEAD (Authenticated Encryption with Associated Data).
   * Generates a cryptographically secure random **24-byte nonce** for every saved or updated credential.
   * If ciphertext is tampered with or corrupted, decryption fails safely.
3. **Vault Key Lifecycle**:
   * The 256-bit vault encryption key is derived dynamically on login using Argon2id key derivation (`crypto_pwhash`) with the user's unique 16-byte salt.
   * Stored in server memory only during active sessions and securely wiped with `sodium_memzero` on logout or session expiration.
   * The raw vault key is **never sent to JavaScript** or written to disk.
4. **SQL Injection Defense**:
   * 100% of database interactions use SQLite prepared statements (`sqlite3_prepare_v2` and `sqlite3_bind_*`).
5. **Ownership Enforcement**:
   * Every query filters strictly on `user_id` derived from the validated server-side session.

---

## 📂 Project Directory Structure

```
SecureVault/
├── backend/
│   ├── main.cpp                  # Server entry point, Crow routing, and HTTP handlers
│   ├── database/
│   │   ├── database.hpp          # SQLite database interface & record structs
│   │   └── database.cpp          # Prepared statements & database persistence
│   └── services/
│       ├── crypto_service.hpp    # Libsodium Argon2id & XChaCha20 wrappers
│       ├── crypto_service.cpp    # Cryptographic implementation
│       ├── session_service.hpp   # In-memory session manager with key wiping
│       └── session_service.cpp   # Session lifecycle & auto-expiration
├── frontend/
│   ├── index.html                # Welcome & health check landing page
│   ├── login.html                # Master vault unlock page
│   ├── register.html             # Master account creation page
│   ├── dashboard.html            # Main vault dashboard & credentials manager
│   ├── css/
│   │   └── style.css             # Unified modern dark theme
│   └── js/
│       ├── auth.js               # Login, registration, and session client logic
│       └── vault.js              # Credentials CRUD, search, filter, and generator
├── third_party/
│   ├── crow/                     # Crow C++ web framework
│   ├── asio/                     # Standalone Asio networking headers
│   ├── sqlite/                   # Official SQLite amalgamation (sqlite3.c / .h)
│   └── libsodium/                # Libsodium cryptography library & headers
├── data/
│   └── securevault.db            # SQLite database file (created automatically)
├── CMakeLists.txt                # CMake build configuration
└── README.md                     # Project documentation
```

---

## 🚀 How to Build and Run

### Prerequisites
* C++17 compatible compiler (e.g. GCC 9+, Clang 10+)
* CMake (v3.15 or newer)
* Standard Linux libraries: `pthread`, `dl`

### Quick Start Commands
```bash
# 1. Navigate to the project directory
cd ~/Projects/SecureVault

# 2. Configure build files with CMake
cmake -B build

# 3. Compile the application
cmake --build build

# 4. Start the server
./build/securevault_server
```

Once running, open your favorite web browser and visit:
👉 **`http://localhost:8080`**

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service status check | No |
| `POST` | `/api/register` | Register new user account | No |
| `POST` | `/api/login` | Authenticate user & start session | No |
| `POST` | `/api/logout` | Terminate session & wipe keys | Yes |
| `GET` | `/api/auth/me` | Fetch active profile | Yes |
| `GET` | `/api/vault` | Retrieve & decrypt all credentials | Yes |
| `POST` | `/api/vault` | Encrypt & save a new credential | Yes |
| `PUT` | `/api/vault/:id` | Update an existing credential | Yes |
| `DELETE` | `/api/vault/:id` | Permanently remove a credential | Yes |

---

## 🎓 Academic Demonstration Guide

For practical exams, viva, or engineering project presentations:
1. **Show the Web UI**: Visit `http://localhost:8080` to demonstrate the clean interface and health check.
2. **Register a Test Account**: Register `bob@example.com` with a strong master password.
3. **Add Credentials**: Add a few sample services (e.g. GitHub, University Portal, Spotify).
4. **Show Live Masking**: Demonstrate how passwords are kept hidden with `••••••••` by default and revealed only on demand.
5. **Demonstrate SQLite Ciphertext**:
   Open a terminal and query `data/securevault.db`:
   ```bash
   sqlite3 data/securevault.db "SELECT website, username, hex(encrypted_password), hex(nonce) FROM VaultEntries;"
   ```
   Point out to your instructor that **passwords are stored as authenticated ciphertext and unique nonces**, proving zero plaintext exposure on disk!
