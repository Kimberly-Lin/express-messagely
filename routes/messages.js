"use strict";

const Router = require("express").Router;
const router = new Router();
const { ensureLoggedIn } = require("../middleware/auth");
const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function (res, req) {
  const id = req.params.id;
  const message = await Message.get(id);

  if (res.local.user.username !== message.from_user 
            && res.local.user.username !== message.to_user) {
    throw new UnauthorizedError("YOU CAN'T SEE THIS!");
  }

  return { message };
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res) {
  const fromUsername = res.locals.user.username;
  const { to_username, body } = req.body;
  const message = await Message.create(fromUsername, to_username, body);

  return { message };
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function (req, res) {
  const username = res.locals.user.username;
  const id = req.params.id;

  const { to_user } = await Message.get(id);

  if (to_user.username !== username){
    throw new UnauthorizedError("YOU CAN't MARK THIS AS READ");
  };

  const message = await Message.markRead(id);

  return { message }; 
});

module.exports = router;