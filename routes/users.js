const express = require('express');
const router = express.Router();
const {eventualDb} = require('../db-conn.js');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcryptjs');
const {promisify} = require('util');
const {authenticated} = require('../authenticateRequest');
const {writeMessage} = require('../flashMessage');
const crypto = require('crypto');

// noinspection JSUnresolvedVariable
const bcryptHash = promisify(bcrypt.hash);
const randomBytes = promisify(crypto.randomBytes);

module.exports = (passport) => {
    // noinspection JSUnresolvedFunction
    router.get('/access-key/:access_key',
        async (req, res) => {
            const {access_key} = req.params;
            req.logout();

            const db = await eventualDb;
            const user = await db.collection('users').findOne({access_key});

            user
                ? res.render('auth/access-key', {title: 'Access Key', user, access_key})
                : res.render('auth/access-denied', {title: 'Access Key', access_key})

        }
    );

    // noinspection JSUnresolvedFunction
    router.post('/access-key/:access_key',
        async (req, res) => {
            if (!req.body) {
                return res.sendStatus(400);
            }

            const {access_key} = req.params;
            const {password, password_check} = req.body;

            const db = await eventualDb;
            const user = await db.collection('users').findOne({access_key});

            if (!user) {
                res.render('auth/access-denied', {
                    title: 'Access Key',
                    access_key
                });
                return;
            }

            if (!password || password !== password_check) {
                res.render('auth/access-key',
                    {
                        title:   'Access Key',
                        user,
                        access_key,
                        message: password ? "Passwords must match" : "Password must not be empty"
                    });

                return;
            }

            const hash = await bcryptHash(password, 14);

            await db.collection('users')
                .updateOne(
                    {_id: user._id},
                    {
                        $set:   {password: hash},
                        $unset: {access_key: 1}
                    }
                );

            res.render('auth/access-success', {title: 'Password Set'});
        }
    );

    // noinspection JSUnresolvedFunction
    router.get('/request-access',
        (req, res) => {
            const message = req.session.message;
            req.session.message = null;
            res.render('auth/request-access', {title: 'Request Access', message})
        }
    );

    // noinspection JSUnresolvedFunction
    router.post('/request-access',
        async (req, res) => {

            const {email, name, password, password_check} = req.body;

            if (!email || !name || !password) {
                req.session.message = "Email, name, and password must be provided";
                return res.redirect(req.baseUrl + '/request-access');
            }

            if (password !== password_check) {
                req.session.message = "Passwords do not match";
                return res.redirect(req.baseUrl + '/request-access');
            }

            const db = await eventualDb;
            const user = await db.collection('users').findOne({email});
            if (user) {
                req.session.message = 'An account with that email already exists';
                return res.redirect(req.baseUrl + '/request-access');
            }

            const hash = await bcryptHash(password, 14);
            await db.collection('users')
                .insertOne({
                    name,
                    email,
                    password: hash,
                    roles:    []
                });

            res.redirect(req.baseUrl + '/request-access-success');
        }
    );

    // noinspection JSUnresolvedFunction
    router.get('/request-access-success',
        (req, res) => {
            const message = req.session.message;
            req.session.message = null;
            res.render('auth/request-access-success', {title: 'Success', message})
        }
    );

    // noinspection JSUnresolvedFunction
    router.post('/login',
        (req, res, next) =>
            passport.authenticate(
                'local',
                {},
                (err, user) => user ? req.logIn(user, next) : next(err)
            )(req, res, next),
        (req, res) => res.redirect(req.body.redirect_url || '/')
    );

    // noinspection JSUnresolvedFunction
    router.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    // noinspection JSUnresolvedFunction
    router.get(
        '/',
        authenticated('Admin'),
        async (req, res) => {
            const addUserActions = user => {
                const roleActions = ['Admin', 'Registered', 'Player'].map(role => {
                        const url = [req.baseUrl, 'toggle-role', user._id, role].join('/');

                        if (user._id.equals(req.user._id) && role === 'Admin') {
                            return null;
                        }

                        return (user.roles || []).includes(role)
                            ? {label: 'Remove ' + role, color: 'alert', post: url}
                            : {label: 'Add ' + role, color: 'primary', post: url}
                    }
                );
                const actions = [
                    user.access_key
                        ? {
                            label: user.access_key,
                            color: 'secondary',
                            get:   req.baseUrl + '/access-key/' + user.access_key
                        }
                        : {
                            label: 'Generate Access Key',
                            color: 'primary',
                            post:  req.baseUrl + '/generate-access-key/' + user._id
                        },

                    ...roleActions
                ];

                const toMerge = {actions}

                if(!user.name && user.discordProfile)
                {
                    toMerge.name = user.discordProfile.username;
                    toMerge.email = '[Discord User]';
                }

                return Object.assign({}, user, toMerge);
            };

            try {
                const db = await eventualDb;
                const users = await db.collection('users').find().sort({name: 1}).toArray();

                res.render(
                    'auth/list',
                    {
                        title: 'Users - Admin',
                        users: users.map(addUserActions)
                    }
                );
            } catch (err) {
                console.log(err);
                res.redirect('/');
            }

        }
    );

    // noinspection JSUnresolvedFunction
    router.post(
        '/generate-access-key/:id',
        authenticated('Admin'),
        async (req, res) => {
            const {id} = req.params;
            const _id = ObjectId(id);

            const db = await eventualDb;
            const user = await db.collection('users').findOne({_id});
            if (!user) {
                writeMessage(req, "Failed to find user.", 'alert');
                return res.redirect(req.baseUrl)
            }

            const access_key = await randomBytes(16).then(buffer => buffer.toString('hex'));

            await db.collection('users')
                .updateOne(
                    {_id},
                    {$set: {access_key}}
                );

            res.redirect(req.baseUrl);
        }
    );

    // noinspection JSUnresolvedFunction
    router.post(
        '/toggle-role/:id/:role',
        authenticated('Admin'),
        async (req, res) => {
            const {id, role} = req.params;
            const _id = ObjectId(id);

            const db = await eventualDb;

            const user = await db.collection('users').findOne({_id});
            if (!user) {
                writeMessage(req, "Failed to find user.", 'alert');
                return res.redirect(req.baseUrl)
            }

            const removed = (user.roles || []).filter(r => r !== role);
            const toggled = removed.length === (user.roles || []).length
                ? removed.concat([role])
                : removed;

            try {
                await db.collection('users').updateOne(
                    {_id},
                    {$set: {roles: toggled}}
                );

                writeMessage(req, 'User role updated.', 'success');
                res.redirect(req.baseUrl);
            }
            catch (err) {
                writeMessage(req, 'Failed to update user: ' + err, 'alert');
                res.redirect(req.baseUrl);
            }
        });

    return router;
};
