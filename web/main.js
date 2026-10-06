const monInput = document.getElementById('monInput');
const monInput2 = document.getElementById('monInput2');
const monBouton = document.getElementById('monBouton');
const monBouton2 = document.getElementById('monBouton2');
const monInputVote = document.getElementById('monInputVote'); 
const monBoutonVoter = document.getElementById('monBoutonVote');
const usersListSelect = document.getElementById('usersList'); 

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

function chargerVotes() {
    fetch('/votes-count')
        .then(response => response.json())
        .then(votes => {
            const listUl = document.getElementById('listUl');
            votes.forEach(vote => {
                const li = document.createElement('li');
                li.innerHTML = `vote : ${vote.login} a voté pour ${vote.vote}`;
                listUl.appendChild(li);
            });
        });
}

-
monBouton2.addEventListener('click', () => {
    fetch('/info')
        .then(response => response.json())
        .then(json => {
            document.getElementById('reponse').innerHTML = json.cle1;
        });
});


monBouton.addEventListener('click', () => {
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            inputValue: monInput.value,
            inputValue2: monInput2.value
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        chargerUtilisateurs(); 
    });
});


const loginButton = document.getElementById('loginButton');
loginButton.addEventListener('click', () => {
    const loginInput = document.getElementById('loginInput').value;
    const passwordInput = document.getElementById('passwordInput').value;

    fetch('/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginInput, password: passwordInput })
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

monBoutonVoter.addEventListener('click', () => {
    const recupUserId = localStorage.getItem('userId');
    const candidatChoisi = monInputVote.value;

    if (!recupUserId) {
        alert("Vous devez vous connecter avant de voter ");
        return;
    }

    fetch('/voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: recupUserId, 
            voteValue: candidatChoisi
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        alert(data.message);
        chargerVotes(); 
    });
});