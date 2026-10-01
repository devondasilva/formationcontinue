#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [, , username, password, displayName] = process.argv;
if (!username || !password) {
  console.error('Usage : node scripts/create-admin.js <identifiant> <mot-de-passe> "<nom affiché>"');
  process.exit(1);
}

const file = path.join(__dirname, "..", "data", "admins.json");
const admins = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : [];

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");

const existingIdx = admins.findIndex((a) => a.username === username);
const admin = {
  id: existingIdx >= 0 ? admins[existingIdx].id : `admin-${Date.now().toString(36)}`,
  username,
  name: displayName || username,
  passwordHash: hash,
  passwordSalt: salt,
  createdAt: existingIdx >= 0 ? admins[existingIdx].createdAt : new Date().toISOString(),
};

if (existingIdx >= 0) {
  admins[existingIdx] = admin;
  console.log(`Mot de passe mis à jour pour l'administrateur "${username}".`);
} else {
  admins.push(admin);
  console.log(`Administrateur "${username}" créé.`);
}
fs.writeFileSync(file, JSON.stringify(admins, null, 2), "utf-8");
