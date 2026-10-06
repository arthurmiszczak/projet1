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


const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');

loginButton.addEventListener('click', () => {
    fetch('/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            login: loginInput.value,
            password: passwordInput.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.User) {
            alert(data.message + ' ID: ' + data.User.id);
            localStorage.setItem('userId', data.User.id);
            localStorage.setItem('userlogin', data.User.login);
        } else {
            alert(data.message);
        }
    });
});
