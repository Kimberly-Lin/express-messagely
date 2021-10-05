"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");


describe("User Routes Test", function () {
    let u1Token;
    let u2Token;

    beforeEach(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");

        let u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });

        u1Token = jwt.sign({ username: u1.username }, SECRET_KEY);

        let u2 = await User.register({
            username: "test2",
            password: "password",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155555555",
        });

        u2Token = jwt.sign({ username: u2.username }, SECRET_KEY);

        let m1 = await Message.create({
            from_username: "test1",
            to_username: "test2",
            body: "This is test message 1!"
        });

    });

    /** GET / - get list of users.
     *
     * => {users: [{username, first_name, last_name, phone}, ...]}
     *
     **/
    describe("GET /users/", function () {
        test("can get users list when logged in", async function () {

            let response = await request(app)
                .get("/users/")
                .send({_token: u1Token});

            expect(response.body).toEqual({
                users: [{
                    username: "test1",
                    first_name: "Test1",
                    last_name: "Testy1",
                    phone: "+14155550000"
                },
                {
                    username: "test2",
                    first_name: "Test2",
                    last_name: "Testy2",
                    phone: "+14155555555"
                }]
            });
            expect(response.statusCode).toEqual(200);
        });

        test("cannot get users list when logged out", async function () {
            let response = await request(app)
                .get("/users/");

            expect(response.statusCode).toEqual(401);
        });

    describe("GET /:username", function () {
        test("can get user detail page for logged in user", async function () {
            let response = await request(app)
                .get("/users/test1")
                .send({_token: u1Token});

            console.log("type of join_at ", typeof response.body.user.join_at)
            expect(response.body).toEqual({
                user: {
                    username: "test1",
                    first_name: "Test1",
                    last_name: "Testy1",
                    phone: "+14155550000", 
                    join_at: expect.any(String),
                    last_login_at: expect.any(String)
                }
            });
            
        });
    });
    });
});

afterAll(async function () {
    await db.end();
});

// GET username
// good request with real username and a bad request with fake username and not logged in
// GET username-to
// good request and bad request from different user and not logged in
// GET username-from
// good request and bad request from different user and not logged in