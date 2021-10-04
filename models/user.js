"use strict";

const bcrypt = require("bcrypt");
const { NotFoundError } = require("../expressError");
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const Message = require("./message");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username,
                                   password,
                                   first_name,
                                   last_name,
                                   phone,
                                   join_at,
                                   last_login_at)
               VALUES
                 ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
               RETURNING username, password, first_name, last_name, phone`,
      [username, hashPw, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`, [username])

    const user = result.rows[0];

    if (user) {
      return (await bcrypt.compare(password, user.password) === true);
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
      [username]);

    console.log(result.rows[0])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users
        ORDER BY last_name, first_name`
    )
    const users = result.rows;
    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, 
              first_name, 
              last_name,
              phone, 
              join_at, 
              last_login_at
      FROM users
      WHERE username = $1`, 
      [username]
    );
    
    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError();
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResults = await db.query(
      `SELECT id
      FROM messages
      WHERE from_username = $1
      ORDER BY id`, [username]
    );
    
    const messages = messageResults.rows;

    if (!messages[0]) {
      throw new NotFoundError();
    }

    const messagesWithRecipientInfo = messages.map(async message => {
      let messageInfo = await Message.get(message.id);
      return { id : messageInfo.id, 
                to_user : messageInfo.to_user, 
                body : messageInfo.body,
                sent_at : messageInfo.sent_at, 
                read_at : messageInfo.read_at,
                }
    });

    return await (Promise.all(messagesWithRecipientInfo));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messageResults = await db.query(
      `SELECT id
      FROM messages
      WHERE to_username = $1
      ORDER BY id`, [username]
    );
    
    const messages = messageResults.rows;

    if (!messages[0]) {
      throw new NotFoundError();
    }

    const messagesWithRecipientInfo = messages.map(async message => {
      let messageInfo = await Message.get(message.id);
      return { id : messageInfo.id, 
                from_user : messageInfo.from_user, 
                body : messageInfo.body,
                sent_at : messageInfo.sent_at, 
                read_at : messageInfo.read_at,
                }
    });

    return await (Promise.all(messagesWithRecipientInfo));
  }
}


module.exports = User;
