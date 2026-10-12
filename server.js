const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Les sessions sont gardées en mémoire.
// Elles sont supprimées quand le serveur redémarre.
const sessions = new Map();

// Connexion à la base de données
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

// Lecture des données reçues et accès aux fichiers du dossier web
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web')));

// Afficher la page principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Récupérer l'identifiant de session dans le cookie
function getSessionId(req) {
  const cookie = req.headers.cookie || '';
  const resultat = cookie.match(/(?:^|;\s*)sid=([^;]+)/);

  if (resultat) {
    return decodeURIComponent(resultat[1]);
  }

  return null;
}

// Vérifier que l'utilisateur est connecté
function verifierConnexion(req, res, next) {
  const sessionId = getSessionId(req);
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ message: 'Veuillez vous connecter.' });
  }

  connection.query(
    'SELECT id, login, admin FROM `User` WHERE id = ?',
    [session.userId],
    (erreur, resultats) => {
      if (erreur) {
        console.log(erreur);
        return res.status(500).json({ message: 'Erreur serveur.' });
      }

      if (resultats.length === 0) {
        sessions.delete(sessionId);
        return res.status(401).json({ message: 'Session invalide.' });
      }

      req.user = resultats[0];
      req.sessionId = sessionId;
      next();
    }
  );
}

// Vérifier que l'utilisateur connecté est admin
function verifierAdmin(req, res, next) {
  verifierConnexion(req, res, () => {
    if (Number(req.user.admin) !== 1) {
      return res.status(403).json({ message: 'Accès réservé à l’administrateur.' });
    }

    next();
  });
}

async function hasherMotDePasse(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function verifierMotDePasse(password, motDePasseStocke) {
  if (!motDePasseStocke) {
    return false;
  }

  if (motDePasseStocke.startsWith('$2')) {
    return bcrypt.compare(password, motDePasseStocke);
  }

  return password === motDePasseStocke;
}

// Créer un compte
app.post('/inscription', async (req, res) => {
  const login = req.body.inputValue;
  const password = req.body.inputValue2;

  if (!login || !password) {
    return res.status(400).json({
      message: 'Il faut saisir un identifiant et un mot de passe.'
    });
  }

  if (password.length < 4 || password.length > 8) {
    return res.status(400).json({
      message: 'Le mot de passe doit contenir entre 4 et 8 caractères.'
    });
  }

  try {
    const motDePasseHache = await hasherMotDePasse(password);

    connection.query(
      'INSERT INTO `User` (login, password, admin) VALUES (?, ?, 0)',
      [login, motDePasseHache],
      (erreur, resultat) => {
        if (erreur) {
          console.log(erreur);

          if (erreur.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Cet identifiant existe déjà.' });
          }

          return res.status(500).json({ message: 'Erreur serveur.' });
        }

        res.status(201).json({
          message: 'Compte créé !',
          userId: resultat.insertId
        });
      }
    );
  } catch (erreur) {
    console.log(erreur);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Connecter un utilisateur
app.post('/connexion', (req, res) => {
  const login = req.body.login;
  const password = req.body.password;

  if (!login || !password) {
    return res.status(400).json({
      message: 'Il faut saisir un identifiant et un mot de passe.'
    });
  }

  connection.query(
    'SELECT id, password FROM `User` WHERE login = ?',
    [login],
    async (erreur, resultats) => {
      if (erreur) {
        console.log(erreur);
        return res.status(500).json({ message: 'Erreur serveur.' });
      }

      if (resultats.length === 0) {
        return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect.' });
      }

      const utilisateur = resultats[0];

      try {
        const motDePasseValide = await verifierMotDePasse(password, utilisateur.password);

        if (!motDePasseValide) {
          return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect.' });
        }

        if (utilisateur.password && !utilisateur.password.startsWith('$2')) {
          const motDePasseHache = await hasherMotDePasse(password);

          connection.query(
            'UPDATE `User` SET password = ? WHERE id = ?',
            [motDePasseHache, utilisateur.id],
            (erreurMiseAJour) => {
              if (erreurMiseAJour) {
                console.log(erreurMiseAJour);
              }
            }
          );
        }

        const sessionId = crypto.randomBytes(32).toString('hex');

        sessions.set(sessionId, {
          userId: utilisateur.id
        });

        res.setHeader(
          'Set-Cookie',
          `sid=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`
        );

        res.json({ message: 'Connexion réussie !' });
      } catch (erreur) {
        console.log(erreur);
        return res.status(500).json({ message: 'Erreur serveur.' });
      }
    }
  );
});

// Renvoyer les informations de l'utilisateur connecté
app.get('/api/me', verifierConnexion, (req, res) => {
  res.json({
    id: req.user.id,
    login: req.user.login,
    admin: Number(req.user.admin) === 1
  });
});

// Déconnecter l'utilisateur
app.post('/deconnexion', (req, res) => {
  const sessionId = getSessionId(req);

  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.setHeader(
    'Set-Cookie',
    'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
  );

  res.json({ message: 'Déconnexion réussie.' });
});

// Récupérer la liste des comptes (admin uniquement)
app.get('/api/users', verifierAdmin, (req, res) => {
  connection.query(
    'SELECT id, login, admin FROM `User` ORDER BY id',
    (erreur, utilisateurs) => {
      if (erreur) {
        console.log(erreur);
        return res.status(500).json({ message: 'Erreur serveur.' });
      }

      res.json(utilisateurs);
    }
  );
});

// Modifier un compte (admin uniquement)
app.put('/api/users/:id', verifierAdmin, (req, res) => {
  const id = Number(req.params.id);
  const login = req.body.login;
  const password = req.body.password;
  const admin = Number(req.body.admin) === 1 ? 1 : 0;

  if (!Number.isInteger(id) || !login || !login.trim()) {
    return res.status(400).json({ message: 'Informations invalides.' });
  }

  // Si le champ mot de passe est vide, on ne le modifie pas
  if (password) {
    hasherMotDePasse(password)
      .then((motDePasseHache) => {
        connection.query(
          'UPDATE `User` SET login = ?, password = ?, admin = ? WHERE id = ?',
          [login.trim(), motDePasseHache, admin, id],
          repondreModification
        );
      })
      .catch((erreur) => {
        console.log(erreur);
        return res.status(500).json({ message: 'Erreur serveur.' });
      });
  } else {
    connection.query(
      'UPDATE `User` SET login = ?, admin = ? WHERE id = ?',
      [login.trim(), admin, id],
      repondreModification
    );
  }

  function repondreModification(erreur) {
    if (erreur) {
      console.log(erreur);

      if (erreur.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Cet identifiant existe déjà.' });
      }

      return res.status(500).json({ message: 'Erreur serveur.' });
    }

    res.json({ message: 'Compte modifié.' });
  }
});

// Supprimer un compte (admin uniquement)
app.delete('/api/users/:id', verifierAdmin, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identifiant invalide.' });
  }

  if (id === Number(req.user.id)) {
    return res.status(400).json({
      message: 'Vous ne pouvez pas supprimer votre propre compte.'
    });
  }

  connection.query(
    'DELETE FROM `User` WHERE id = ?',
    [id],
    (erreur) => {
      if (erreur) {
        console.log(erreur);
        return res.status(500).json({ message: 'Erreur serveur.' });
      }

      res.json({ message: 'Compte supprimé.' });
    }
  );
});

// Connexion à MySQL, puis démarrage du serveur
connection.connect((erreur) => {
  if (erreur) {
    console.log('Erreur de connexion à MySQL :', erreur);
    return;
  }

  console.log('Connexion à MySQL réussie.');

  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}.`);
  });
});