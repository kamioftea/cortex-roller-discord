const {ofType} = require('redux-observable');
const {mergeMap}= require('rxjs/operators');

const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb');
const {eventualDb} = require('../db-conn.js');
const {writeMessage} = require('../flashMessage.js');
const {authenticated} = require('../authenticateRequest');
const {dispatch, registerAsyncEpic} = require('../model');
const {addScript, filterObject} = require('../util');

const dice = [
    {value: 4, label: 'D4'},
    {value: 6, label: 'D6'},
    {value: 8, label: 'D8'},
    {value: 10, label: 'D10'},
    {value: 12, label: 'D12'},
]

const attributes = ['agility', 'awareness', 'influence', 'intellect', 'spirit', 'strength'];
const values = ['devotion', 'glory', 'justice', 'liberty', 'mastery', 'truth'];
const distinctions = ['origin', 'vocation', 'quirk'];

router.use(authenticated('Admin'));

router.use((req, res, next) => {
    res.locals.base_url = req.baseUrl;
    next();
})

/* GET character list page. */
router.get('/', async function (req, res) {
    const db = await eventualDb;
    const characters = await db.collection('characters').find().sort({name: 1}).toArray();
    const users = await db.collection('users')
                          .find({roles: 'Player'})
                          .sort({name: 1})
                          .toArray();
    const userOptions = [...users].map(
        ({_id, name, discordProfile}) => ({_id, name: name || discordProfile.username})
    );

    addScript(res, '/javascripts/character/list.js');

    res.render(
        'characters/list',
        {
            title: 'Characters - Admin',
            characters,
            users: userOptions,
        }
    );
});

router.get(
    '/add',
    (req, res) => {
        const url_prefix = 'https://' + req.get('host');
        addScript(res, '/javascripts/image-upload.js');
        addScript(res, '/javascripts/form-template.js');

        res.render(
            'characters/form',
            {
                title: 'Add Character - Admin',
                url_prefix,
                dice,
                attributes,
                values,
                distinctions,
            }
        );
    }
)

router.post(
    '/add',
    async (req, res) => {
        const {
            name,
            description,
            icon_url,
            image_url,
            attributes,
            catalyst_die,
            misc,
            values,
            distinctions,
            specialities,
            signature_asset,
        } = req.body;

        if (name) {
            const db = await eventualDb;
            let filteredAttributes = filterObject(attributes, a => a.die);
            await db.collection('characters').insertOne({
                name,
                description,
                icon_url,
                image_url,
                attributes:      filteredAttributes,
                catalyst_die:    catalyst_die || null,
                misc,
                values:          filterObject(values, v => v.die),
                distinctions:    filterObject(distinctions, d => d.label),
                specialities,
                signature_asset: signature_asset.die ? signature_asset : null,
                plot_points:     catalyst_die || filteredAttributes ? 1 : 0,
                stress:          {},
            })
            res.redirect(req.baseUrl)
        }
        else {
            writeMessage(req, 'Name must be provided', 'alert');
            res.redirect(req.originalUrl)
        }

    }
)

router.get(
    '/edit/:id',
    async (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const url_prefix = 'https://' + req.get('host');
        addScript(res, '/javascripts/image-upload.js');
        addScript(res, '/javascripts/form-template.js');

        const db = await eventualDb;
        const character = await db.collection('characters').findOne({_id})

        if (character) {
            console.log(character);

            // noinspection JSUnresolvedVariable
            res.render('characters/form', {
                title: `Edit ${character.name || 'Character'} - Admin`,
                character,
                url_prefix,
                dice,
                attributes,
                values,
                distinctions,
            });
        }
        else {
            writeMessage(req, 'Failed to find character', 'warning');
            return res.redirect(req.baseUrl)
        }
    }
)

router.post(
    '/edit/:id',
    async (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const {
            name,
            description,
            icon_url,
            image_url,
            attributes,
            catalyst_die,
            misc,
            values,
            distinctions,
            specialities,
            signature_asset,
        } = req.body;

        if (name) {
            const db = await eventualDb;
            await db.collection('characters')
                    .updateOne(
                        {_id},
                        {
                            $set: {
                                name,
                                description,
                                icon_url,
                                image_url,
                                attributes:      filterObject(attributes, a => a.die),
                                catalyst_die:    catalyst_die || null,
                                misc:            misc,
                                values:          filterObject(values, v => v.die),
                                distinctions:    filterObject(distinctions, d => d.label),
                                specialities,
                                signature_asset: signature_asset.die ? signature_asset : null,
                            }
                        }
                    )
            res.redirect(req.baseUrl)

            const character = await db.collection('characters').findOne({_id});
            if (character && character._player_id) {
                dispatch({type: 'set-character-player', user_id: character._player_id, character})
            }
        }
        else {
            writeMessage(req, 'Name must be provided', 'alert');
            res.redirect(req.originalUrl)
        }
    }
)

router.post(
    '/set-player/:id',
    async (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const {player_id} = req.body;
        const _player_id = player_id ? ObjectId(player_id) : null;

        const db = await eventualDb;

        if (_player_id) {
            const player = await db.collection('users').findOne({_id: _player_id, roles: 'Player'});
            if (!player) {
                return res.json({success: false, error: 'Id must match a player'})
            }
        }

        const updated = await db.collection('characters').updateOne({_id}, {$set: {_player_id}});
        // noinspection JSUnresolvedVariable
        res.json({success: updated.result.nModified === 1});
        const character = await db.collection('characters').findOne({_id});
        if (character) {
            dispatch({type: 'set-character-player', user_id: player_id, character})
        }
    }
)

module.exports = router;

registerAsyncEpic(async msg$ => {
    const db = await eventualDb;

    return msg$.pipe(
        ofType('alter-plot-points'),
        mergeMap(async ({character_id, delta}) => {
            const _id = ObjectId(character_id);
            const character = await db.collection('characters').findOne({_id});
            if (!character) {
                return null;
            }

            character.plot_points = Math.max(0, (character.plot_points || 0) + delta);

            await db.collection('characters')
                    .updateOne({_id}, {$set: {plot_points: character.plot_points}});

            return {type: 'set-character-player', user_id: character._player_id, character}
        })
    )
});

registerAsyncEpic(async msg$ => {
    const db = await eventualDb;

    return msg$.pipe(
        ofType('alter-stress'),
        mergeMap(async ({character_id, stress_type, delta}) => {
            const _id = ObjectId(character_id);
            const character = await db.collection('characters').findOne({_id});
            if (!character) {
                return null;
            }

            if(!character.stress) {
                character.stress = {};
            }

            character.stress[stress_type] = Math.min((character.stress[stress_type] || 4) + (delta * 2), 12);
            if(character.stress[stress_type] < 6) {
                delete character.stress[stress_type];
            }

            await db.collection('characters')
                    .updateOne({_id}, {$set: {stress: character.stress}});

            return {type: 'set-character-player', user_id: character._player_id, character}
        })
    )
});
