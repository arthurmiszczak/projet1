const http = require("http");
const express = require('express');
const app = express();
const mysql = require('mysql2');
const ip = require("ip"); 
require('dotenv').config();


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

const PORT = 3000;


const server = app.listen(3000, () => {
  console.log('Server started on port 3000');
});      


connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
  } else {
    console.log('Connexion à la base de données réussie !');
  }
});



const path = require('path');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
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
            res.json({ message: 'Inscription réussie !', userId: results.insertId });
        }
    );
});







app.post('/connexion', (req, res) => {
    const { login, password } = req.body;
    connection.query('SELECT * FROM User WHERE login = ? AND password = ?', [login, password], (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
        if (results.length === 0) {
            res.status(401).json({ message: 'Identifiants invalides' });
            return;
        }
        res.json({ message: 'Connexion réussie !', User: results[0] });
    });
});