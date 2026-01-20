// --- KONFIGURACJA BAZY DANYCH ---
const DB_USERS_KEY = 'users';
const DB_SESSION_KEY = 'sessionUser';

// Inicjalizacja
function initDatabase() {
    if (!localStorage.getItem(DB_USERS_KEY)) {
        const defaultUsers = [
            {
                firstName: "Kasia",
                lastName: "Cichowski",
                email: "kasia@example.com",
                phone: "123456789",
                password: "password123",
                orders: [],
                settings: {}
            }
        ];
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(defaultUsers));
    }
}
initDatabase();

// --- FUNKCJA REJESTRACJI (Z WALIDACJĄ TELEFONU) ---
function registerUser(firstName, lastName, email, phone, password) {
    if (!email || !password) {
        return { success: false, message: "E-mail i hasło są wymagane." };
    }

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    } catch (e) {
        users = [];
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim(); // Czyścimy spacje z numeru

    // 1. SPRAWDZANIE EMAILA
    const emailExists = users.some(u => u && u.email && u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
        return { success: false, message: "Ten adres e-mail jest już zajęty." };
    }

    // 2. SPRAWDZANIE TELEFONU (NOWOŚĆ)
    const phoneExists = users.some(u => u && u.phone && u.phone === cleanPhone);
    if (phoneExists) {
        return { success: false, message: "Ten numer telefonu jest już zajęty." };
    }

    // Tworzenie nowego użytkownika
    const newUser = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: password,
        orders: [],
        settings: {}
    };

    users.push(newUser);
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

    return { success: true, message: "Konto utworzone pomyślnie." };
}

// --- FUNKCJA LOGOWANIA ---
function loginUser(email, password) {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    } catch (e) {
        users = [];
    }

    const cleanEmail = email.trim().toLowerCase();

    const foundUser = users.find(u =>
        u && u.email && u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (foundUser) {
        localStorage.setItem(DB_SESSION_KEY, JSON.stringify(foundUser));
        return true;
    }
    return false;
}

// --- RESZTA FUNKCJI (BEZ ZMIAN) ---
function logoutUser() {
    localStorage.removeItem(DB_SESSION_KEY);
    window.location.href = 'index.html';
}

function getCurrentUser() {
    try {
        const userJson = localStorage.getItem(DB_SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        return null;
    }
}

function requireAuth() {
    if (!getCurrentUser()) {
        window.location.href = 'login.html';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();
    const authBtn = document.getElementById('authBtn');
    const accountLink = document.getElementById('accountLink');

    if (user) {
        if (authBtn) {
            authBtn.textContent = "Wyloguj się";
            authBtn.href = "#";
            authBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }
        if (accountLink) accountLink.style.display = 'inline-block';
    }
});

function saveUserPreferences(newSettings) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    currentUser.settings = newSettings;
    localStorage.setItem(DB_SESSION_KEY, JSON.stringify(currentUser));

    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    const index = users.findIndex(u => u && u.email === currentUser.email);

    if (index !== -1) {
        users[index].settings = newSettings;
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
        return true;
    }
    return false;
}

function addOrderToHistory(orderData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    const index = users.findIndex(u => u && u.email === currentUser.email);

    if (index !== -1) {
        if (!users[index].orders) users[index].orders = [];
        const newOrder = { id: Date.now(), ...orderData };
        users[index].orders.push(newOrder);
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
        currentUser.orders = users[index].orders;
        localStorage.setItem(DB_SESSION_KEY, JSON.stringify(currentUser));
    }
}

// --- ZMIANA HASŁA ---
function changeUserPassword(oldPassword, newPassword) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, message: "Nie jesteś zalogowany." };

    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    const index = users.findIndex(u => u.email === currentUser.email);

    if (index !== -1) {
        // 1. Sprawdź czy stare hasło się zgadza
        if (users[index].password !== oldPassword) {
            return { success: false, message: "Stare hasło jest nieprawidłowe." };
        }

        // 2. Zapisz nowe hasło
        users[index].password = newPassword;
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

        // 3. Zaktualizuj sesję (opcjonalne, ale dobra praktyka)
        currentUser.password = newPassword;
        localStorage.setItem(DB_SESSION_KEY, JSON.stringify(currentUser));

        return { success: true, message: "Hasło zostało zmienione." };
    }
    return { success: false, message: "Błąd użytkownika." };
}

// --- ULUBIENI ARTYŚCI ---

function addFavoriteArtist(artistName) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    const index = users.findIndex(u => u.email === currentUser.email);

    if (index !== -1) {
        // Inicjalizacja tablicy jeśli nie istnieje
        if (!users[index].favoriteArtists) {
            users[index].favoriteArtists = [];
        }

        // Sprawdź duplikaty (bez względu na wielkość liter)
        const exists = users[index].favoriteArtists.some(
            a => a.toLowerCase() === artistName.toLowerCase()
        );

        if (!exists) {
            users[index].favoriteArtists.push(artistName);

            // Zapisz w bazie i sesji
            localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
            currentUser.favoriteArtists = users[index].favoriteArtists;
            localStorage.setItem(DB_SESSION_KEY, JSON.stringify(currentUser));
            return true;
        }
    }
    return false;
}

function removeFavoriteArtist(artistName) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    const index = users.findIndex(u => u.email === currentUser.email);

    if (index !== -1 && users[index].favoriteArtists) {
        users[index].favoriteArtists = users[index].favoriteArtists.filter(
            a => a !== artistName
        );

        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
        currentUser.favoriteArtists = users[index].favoriteArtists;
        localStorage.setItem(DB_SESSION_KEY, JSON.stringify(currentUser));
    }
}

function getFavoriteArtists() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.favoriteArtists ? currentUser.favoriteArtists : [];
}