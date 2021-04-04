const passport = require('passport');
const {Strategy: OAuth2Strategy} = require('passport-oauth2');
const {Strategy: LocalStrategy} = require('passport-local');
const {ObjectID} = require('mongodb');
const {eventualDb} = require('./db-conn.js');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');

class DiscordStrategy extends OAuth2Strategy {

    constructor(options, verify) {
        super(options, verify);
    }

    // noinspection JSUnusedGlobalSymbols
    userProfile(accessToken, done) {
        fetch(
            'https://discord.com/api/users/@me',
            {
                headers: {
                    Authorization: 'Bearer ' + accessToken
                }
            }
        )
            .then(res => res.json())
            .then(
                res => done(null, res),
                err => done(err)
            )
    };
}

passport.use(new DiscordStrategy({
        authorizationURL: 'https://discord.com/api/oauth2/authorize',
        tokenURL:         'https://discord.com/api/oauth2/token',
        scope:            ['identify'],
        clientID:         '792875561533046824',
        clientSecret:     'ODim9_7hsEoZOW0Ad9ZcKrkJV3ZSSiR1',
        callbackURL:      process.env.DISCORD_CALLBACK_URL || "http://localhost:3000/authorise"
    },
    async function (accessToken, refreshToken, profile, done) {
        try {
            const users = await eventualDb.then(db => db.collection('users'));
            const user = await users.findOne({discordId: profile.id})
            if (user) {
                await users.updateOne(
                    {_id: user._id},
                    {$set: {discordProfile: profile}}
                )

                return done(null, user)
            }

            const result = await users.insertOne({
                discordId:      profile.id,
                discordProfile: profile
            })

            done(null, result.ops[0])
        } catch (err) {
            return done(err);
        }
    }
));

passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (username, password, cb) => {
        try {
            const db = await eventualDb;
            const user = await db.collection('users').findOne({email: username});
            const result = user && user.roles && user.roles.length > 0
                ? await bcrypt.compare(password, user.password)
                : false;

            cb(null, result && user);
        }
        catch(err) {
            cb(err)
        }
    }
));

passport.serializeUser((user, done) => {
    return done(null, user._id)
});

passport.deserializeUser(
    (id, cb) => {
        eventualDb.then(db => db.collection('users').findOne({_id: ObjectID(id)}))
            .then(
                user => cb(null, user),
                err => cb(err)
            )
    }
);

module.exports = passport;
