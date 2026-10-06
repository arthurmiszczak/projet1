const inputValue = document.getElementById('monInput');
const inputvalue2 = document.getElementById('monInput2');
const monBouton = document.getElementById('monBouton');
const monBouton2 = document.getElementById('monBouton2');

window.onload = () => {
    chargerUtilisateurs();
    chargerVotes();
};

function chargerUtilisateurs() {
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            const listUl = document.getElementById('listUl');
            
            usersListSelect.innerHTML = "";
            listUl.innerHTML = "";

            users.forEach(user => {

                const option = document.createElement('option');
                option.value = user.id;
                option.text = user.login;
                usersListSelect.appendChild(option);
                const li = document.createElement('li');
                li.innerHTML = `Login: <p>${user.login}</p> (ID: ${user.id})`;
                listUl.appendChild(li);
            });
        });
}


const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const dashboardSection = document.getElementById('dashboardSection');
const adminSection = document.getElementById('adminSection');

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
    dashboardSection.hidden = true;
    signupSection.hidden = true;
    loginSection.hidden = false;
}

async function afficherTableauDeBord() {
    const user = await api('/api/me');

    loginSection.hidden = true;
    signupSection.hidden = true;
    dashboardSection.hidden = false;
    document.getElementById('welcomeMessage').textContent =
        `Bien connecté en tant que ${user.login}`;

    adminSection.hidden = !user.admin;
    if (user.admin) await chargerComptes();
}

async function chargerComptes() {
    const users = await api('/api/users');
    const list = document.getElementById('usersList');
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

document.getElementById('showSignup').addEventListener('click', () => {
    loginSection.hidden = true;
    signupSection.hidden = false;
});

document.getElementById('showLogin').addEventListener('click', afficherConnexion);

document.getElementById('loginForm').addEventListener('submit', async (event) => {
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

document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        const form = Object.fromEntries(new FormData(event.currentTarget));
        const data = await api('/inscription', {
            method: 'POST',
            body: JSON.stringify(form)
        });
        alert(data.message);
        event.currentTarget.reset();
        afficherConnexion();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('logoutButton').addEventListener('click', async () => {
    await api('/deconnexion', { method: 'POST' });
    afficherConnexion();
});

api('/api/me').then(afficherTableauDeBord).catch(() => {
    afficherConnexion();
});
