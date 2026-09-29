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
