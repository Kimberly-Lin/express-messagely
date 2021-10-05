"use strict";

const Router = require("express").Router;
const router = new Router();
const JWT = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { NotFoundError } = require("../expressError");

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res) {
  const { username, password } = req.body;
  const authenticated = await User.authenticate(username, password);

  if (!authenticated) throw new NotFoundError("invalid login credentials");

  User.updateLoginTimestamp(username);
  const token = JWT.sign({ username }, SECRET_KEY);
  return res.json({ token });
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res) {
  const { username, password, first_name, last_name, phone } = req.body;
  await User.register({ username, password, first_name, last_name, phone });
  const token = JWT.sign({ username }, SECRET_KEY);
  return res.json({ token });
});


module.exports = router;