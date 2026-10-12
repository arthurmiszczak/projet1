const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const dashboardSection = document.getElementById('dashboardSection');
const adminSection = document.getElementById('adminSection');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutButton = document.getElementById('logoutButton');
const deleteAccountButton = document.getElementById('deleteAccountButton');

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erreur serveur.');
    return data;
}

function afficherConnexion() {
    if (dashboardSection) dashboardSection.hidden = true;
    if (signupSection) signupSection.hidden = true;
    if (loginSection) loginSection.hidden = false;
}

async function afficherTableauDeBord() {
    const user = await api('/api/me');

    if (loginSection) loginSection.hidden = true;
    if (signupSection) signupSection.hidden = true;
    if (dashboardSection) dashboardSection.hidden = false;

    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bien connecté en tant que ${user.login}`;
    }

    if (adminSection) adminSection.hidden = !user.admin;
    if (user.admin) await chargerComptes();
}

async function chargerComptes() {
    const users = await api('/api/users');
    const list = document.getElementById('usersList');
    if (!list) return;
    list.replaceChildren();

    for (const user of users) {
        const item = document.createElement('li');
        const login = document.createElement('input');
        login.value = user.login;
        login.setAttribute('aria-label', `Identifiant du compte ${user.id}`);

        const password = document.createElement('input');
        password.type = 'password';
        password.placeholder = 'Nouveau mot de passe (facultatif)';
        password.setAttribute('aria-label', `Nouveau mot de passe du compte ${user.id}`);

        const adminLabel = document.createElement('label');
        const admin = document.createElement('input');
        admin.type = 'checkbox';
        admin.checked = Number(user.admin) === 1;
        adminLabel.append(admin, ' Admin');

        const save = document.createElement('button');
        save.textContent = 'Modifier';
        save.type = 'button';
        save.addEventListener('click', async () => {
            try {
                await api(`/api/users/${user.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        login: login.value,
                        password: password.value,
                        admin: admin.checked ? 1 : 0
                    })
                });
                alert('Compte modifié.');
                await chargerComptes();
            } catch (error) {
                alert(error.message);
            }
        });

        const remove = document.createElement('button');
        remove.textContent = 'Supprimer';
        remove.type = 'button';
        remove.addEventListener('click', async () => {
            if (!confirm(`Supprimer le compte ${user.login} ?`)) return;
            try {
                await api(`/api/users/${user.id}`, { method: 'DELETE' });
                await chargerComptes();
            } catch (error) {
                alert(error.message);
            }
        });

        item.append(login, password, adminLabel, save, remove);
        list.appendChild(item);
    }
}

document.getElementById('showSignup')?.addEventListener('click', () => {
    if (loginSection) loginSection.hidden = true;
    if (signupSection) signupSection.hidden = false;
});

document.getElementById('showLogin')?.addEventListener('click', afficherConnexion);

loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        const form = Object.fromEntries(new FormData(event.currentTarget));
        await api('/connexion', {
            method: 'POST',
            body: JSON.stringify(form)
        });
        await afficherTableauDeBord();
    } catch (error) {
        alert(error.message);
    }
});

signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        const form = Object.fromEntries(new FormData(event.currentTarget));
        const data = await api('/inscription', {
            method: 'POST',
            body: JSON.stringify(form)
        });
        alert(data.message);
        const formElement = event.currentTarget;
        if (formElement && typeof formElement.reset === 'function') {
            formElement.reset();
        }
        afficherConnexion();
    } catch (error) {
        alert(error.message);
    }
});

logoutButton?.addEventListener('click', async () => {
    await api('/deconnexion', { method: 'POST' });
    afficherConnexion();
});

deleteAccountButton?.addEventListener('click', async () => {
    if (!confirm('Supprimer définitivement votre compte ?')) return;

    try {
        const data = await api('/api/me', { method: 'DELETE' });
        alert(data.message);
        afficherConnexion();
    } catch (error) {
        alert(error.message);
    }
});

api('/api/me').then(afficherTableauDeBord).catch(() => {
    afficherConnexion();
});
