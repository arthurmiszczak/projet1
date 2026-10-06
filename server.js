const http = require("http");
const express = require('express');
const app = express();
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
  } else {
    console.log('Connexion à la base de données réussie !');
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.get('/users', (req, res) => {
  connection.query(
    'SELECT id, login FROM User',
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }

      res.json(results);
    }
  );
});

app.post('/register', (req, res) => {
  const { inputValue, inputValue2 } = req.body;

  connection.query(
    'INSERT INTO User (login, password) VALUES (?, ?)',
    [inputValue, inputValue2],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }

      res.status(201).json({
        message: 'Inscription réussie !',
        userId: results.insertId
      });
    }
  );
});

app.post('/connexion', (req, res) => {
  const { login, password } = req.body;

  connection.query(
    'SELECT id, login FROM User WHERE login = ? AND password = ?',
    [login, password],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ message: 'Identifiants invalides' });
        return;
      }

      res.json({
        message: 'Connexion réussie !',
        User: results[0]
      });
    }
  );
});