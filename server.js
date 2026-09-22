const http = require("http");
const express = require('express');
const app = express();
const mysql = require('mysql2');
const ip = require("ip"); 

const connection = mysql.createConnection({
    host: '172.29.18.194',
    user: 'user',
    password: 'hUMi*4E!d5y-]Z@2',
    database: 'testjs'
});

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Bonjour, Node.js fonctionne sur la VM !");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
