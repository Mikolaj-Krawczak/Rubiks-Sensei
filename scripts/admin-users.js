const API_BASE_URL = 'http://localhost:2115/api';
const usersApiUrl = `${API_BASE_URL}/uzytkownicy`;

// --- Elementy DOM ---
const usersListContainer = document.querySelector('.users-list');
// Formularz dodawania/edycji (Główny formularz)
const userForm = document.getElementById('user-form');
const formTitle = document.getElementById('form-title');
const userIdInput = document.getElementById('user-id'); // Ukryte pole dla ID w głównym formularzu
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const passwordField = document.getElementById('password-field');
const rankInput = document.getElementById('rank');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formMessageArea = document.getElementById('form-message-area');
// Obszar listy użytkowników
const listMessageArea = document.getElementById('list-message-area');
// Modal edycji
const editModal = document.getElementById('edit-modal');
const editUserForm = document.getElementById('edit-user-form');
const editUserIdInput = document.getElementById('edit-user-id');
const editUsernameInput = document.getElementById('edit-username');
const editRankInput = document.getElementById('edit-rank');
const editMessageArea = document.getElementById('edit-message-area');
// Modal potwierdzenia
const confirmationModal = document.getElementById('confirmation-modal');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');
const confirmationMessage = document.getElementById('confirmation-message');

// --- Zmienne stanu ---
let isEditMode = false; // Śledzi, czy główny formularz jest w trybie edycji (nie używane z modalem)
let userToDeleteId = null; // Przechowuje ID użytkownika do usunięcia

// --- Funkcje pomocnicze ---

// Ulepszona funkcja showMessage - może celować w różne obszary
function showMessage(message, type = 'info', area = formMessageArea) {
    if (!area) return; // Nie rób nic, jeśli obszar nie istnieje
    area.textContent = message;
    // Użyj klas do stylizacji w zależności od typu (sukces, błąd, informacja)
    area.className = `message-area ${type}`;
    // Wyczyść wiadomość po 5 sekundach
    setTimeout(() => {
        area.textContent = '';
        area.className = 'message-area';
    }, 5000);
}

// --- Funkcje interakcji z API ---

async function fetchUsers() {
    showMessage('Ładowanie użytkowników...', 'info', listMessageArea);
    try {
        const response = await fetch(usersApiUrl);
        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status}`);
        }
        const users = await response.json();
        renderUsersList(users);
        if (users.length === 0) {
             showMessage('Nie znaleziono żadnych użytkowników.', 'info', listMessageArea);
        } else {
             showMessage('', 'info', listMessageArea); // Wyczyść wiadomość ładowania
        }
    } catch (error) {
        console.error('Nie udało się pobrać użytkowników:', error);
        showMessage(`Nie udało się pobrać użytkowników. ${error.message}`, 'error', listMessageArea);
    }
}

async function addUser(userData) {
     showMessage('Dodawanie użytkownika...', 'info', formMessageArea);
     try {
        const response = await fetch(usersApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Błąd HTTP: ${response.status}`);
        }
        showMessage(`Użytkownik "${result.nazwa_uzytkownika}" dodany pomyślnie.`, 'success', formMessageArea);
        userForm.reset(); // Resetuj główny formularz
        fetchUsers(); // Odśwież listę
    } catch (error) {
        console.error('Nie udało się dodać użytkownika:', error);
        showMessage(`Błąd podczas dodawania: ${error.message}`, 'error', formMessageArea);
    }
}

async function updateUser(userId, userData) {
    showMessage('Aktualizowanie użytkownika...', 'info', editMessageArea);
    try {
        const response = await fetch(`${usersApiUrl}/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            try {
                const error = JSON.parse(errorText);
                throw new Error(error.error || 'Nie udało się zaktualizować użytkownika');
            } catch (jsonError) {
                throw new Error(`Nie udało się zaktualizować użytkownika: ${errorText.substring(0, 100)}`);
            }
        }

        const result = await response.json();
        showMessage(`Użytkownik "${result.nazwa_uzytkownika}" zaktualizowany.`, 'success', editMessageArea);
        closeEditModal();
        fetchUsers(); // Odśwież listę
    } catch (error) {
        console.error('Nie udało się zaktualizować użytkownika:', error);
        showMessage(`Błąd podczas aktualizacji: ${error.message}`, 'error', editMessageArea);
    }
}

async function deleteUserApi(userId) {
    showMessage('Usuwanie użytkownika...', 'info', listMessageArea);
    try {
        const response = await fetch(`${usersApiUrl}/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            try {
                const error = JSON.parse(errorText);
                throw new Error(error.error || 'Nie udało się usunąć użytkownika');
            } catch (jsonError) {
                throw new Error(`Nie udało się usunąć użytkownika: ${errorText.substring(0, 100)}`);
            }
        }

        const result = await response.json();
        showMessage(result.message || `Użytkownik został usunięty.`, 'success', listMessageArea);
        
        // Natychmiast usuń z UI
        const item = document.querySelector(`[data-id="${userId}"]`);
        if (item) item.remove();
    } catch (error) {
        console.error(`Nie udało się usunąć użytkownika ${userId}:`, error);
        showMessage(`Błąd podczas usuwania: ${error.message}`, 'error', listMessageArea);
    }
}

// --- Funkcje renderujące ---

function renderUsersList(users) {
    usersListContainer.innerHTML = ''; // Wyczyść obecną listę
    if (users.length === 0) {
        usersListContainer.innerHTML = '<p class="no-users-message">Brak użytkowników do wyświetlenia.</p>';
        return;
    }
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.id = user.id;
        userItem.innerHTML = `
            <div class="user-info">
                <div class="user-details">
                    <h4>${user.nazwa_uzytkownika} (ID: ${user.id})</h4>
                    <p>Ranga Kyu: ${user.ranga_kyu}</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="edit-btn">Edytuj</button>
                <button class="delete-btn">Usuń</button>
            </div>
        `;
        // Dodaj nasłuchiwacze zdarzeń do przycisków
        userItem.querySelector('.edit-btn').addEventListener('click', () => openEditModal(user));
        userItem.querySelector('.delete-btn').addEventListener('click', () => confirmUserDeletion(user.id, user.nazwa_uzytkownika));

        usersListContainer.appendChild(userItem);
    });
}

// --- Obsługa modalów ---

function openEditModal(user) {
    editUserIdInput.value = user.id;
    editUsernameInput.value = user.nazwa_uzytkownika;
    editRankInput.value = user.ranga_kyu;
    showMessage('', 'info', editMessageArea); // Wyczyść poprzednie wiadomości
    editModal.style.display = 'block';
}

function closeEditModal() {
    editModal.style.display = 'none';
}

function confirmUserDeletion(userId, username) {
    userToDeleteId = userId;
    confirmationMessage.textContent = `Czy na pewno chcesz usunąć użytkownika "${username}" (ID: ${userId})? Tej operacji nie można cofnąć.`;
    confirmationModal.style.display = 'block';
}

function closeConfirmationModal() {
    confirmationModal.style.display = 'none';
    userToDeleteId = null;
}

// --- Nasłuchiwacze zdarzeń ---

// Wysłanie formularza dodawania użytkownika
userForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value; // Nie przycinaj hasła
    const rank = rankInput.value;

    if (!username) {
        showMessage('Nazwa użytkownika jest wymagana.', 'error', formMessageArea);
        return;
    }
    // Hasło jest wymagane tylko przy dodawaniu
    if (!password) {
        showMessage('Hasło jest wymagane przy tworzeniu użytkownika.', 'error', formMessageArea);
        return;
    }

    const userData = {
        nazwa_uzytkownika: username,
        haslo: password,
        ranga_kyu: parseInt(rank, 10)
    };
    addUser(userData);
});

// Wysłanie formularza edycji użytkownika (w modal)
editUserForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const userId = editUserIdInput.value;
    const username = editUsernameInput.value.trim();
    const rank = editRankInput.value;

    if (!username) {
        showMessage('Nazwa użytkownika jest wymagana.', 'error', editMessageArea);
        return;
    }

    const userData = {
        nazwa_uzytkownika: username,
        ranga_kyu: parseInt(rank, 10)
        // Nie wysyłamy hasła przy aktualizacji
    };
    updateUser(userId, userData);
});

// Przycisk anulowania edycji (nie jest naprawdę potrzebny przy podejściu modalnym, ale może być wykorzystany, jeśli formularz jest używany do edycji również)
cancelEditBtn.addEventListener('click', () => {
    userForm.reset();
    formTitle.textContent = 'Dodaj Nowego Użytkownika';
    passwordField.style.display = 'block';
    passwordInput.required = true;
    cancelEditBtn.style.display = 'none';
    showMessage('', 'info', formMessageArea); // Wyczyść wiadomości
});

// Przycisk modal potwierdzenia
confirmYesBtn.addEventListener('click', () => {
    if (userToDeleteId) {
        deleteUserApi(userToDeleteId);
    }
    closeConfirmationModal();
});

confirmNoBtn.addEventListener('click', closeConfirmationModal);

// Zamknij modal na kliknięcie poza nim
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === confirmationModal) {
        closeConfirmationModal();
    }
});

// --- Początkowe ładowanie ---
document.addEventListener('DOMContentLoaded', fetchUsers); 