const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb');
const {filter, mergeMap} = require('rxjs/operators');
const {of} = require('rxjs');
const {ofType} = require('redux-observable');
const {eventualDb} = require('../db-conn.js');
const {writeMessage} = require('../flashMessage.js');
const {authenticated} = require('../authenticateRequest');
const {dispatch} = require('../model');
const {addScript} = require('../util');
const {registerAsyncEpic} = require('../model');

const positions = [
    {value: 'float-left', label: 'Left'},
    {value: 'float-left flip', label: 'Left, Flipped'},
    {value: 'float-right', label: 'Right'},
    {value: 'float-right flip', label: 'Right, flipped'},
];

const textStyles = [
    {value: 'description-large', label: 'Large Text'},
    {value: 'description-medium', label: 'Medium Text'},
    {value: 'description-small', label: 'Small Text'},
]

router.use(authenticated('Admin'));

router.use((req, res, next) => {
    res.locals.base_url = req.baseUrl;
    next();
})

/* GET snippet list page. */
router.get('/', async function (req, res) {
    const db = await eventualDb;
    const {_id: campaign_id} = res.locals.campaign
    const snippets = await db.collection('snippets').find({campaign_id}).sort({title: 1}).toArray();

    res.render(
        'snippets/list',
        {
            title: 'Snippets - Admin',
            snippets,
        }
    );
});

router.get(
    '/add',
    (req, res) => {
        addScript(res, '/javascripts/image-upload.js');

        res.render(
            'snippets/form',
            {
                title: 'Add Snippet - Admin',
                positions,
                textStyles,
            }
        );
    }
)

router.get(
    '/add/character/:characterId',
    async (req, res) => {
        addScript(res, '/javascripts/image-upload.js');
        addScript(res, '/javascripts/snippets/form.js');

        const {characterId} = req.params;

        if(!characterId) {
            writeMessage(req, 'Character ID must follow /character', 'alert');
            return res.redirect(req.originalUrl)
        }

        const _id = ObjectId(characterId);
        const db = await eventualDb;
        const character = await db.collection('characters').findOne({_id});

        if(!character) {
            writeMessage(req, 'Character Not Found', 'alert');
            return res.redirect(req.originalUrl)
        }

        res.render(
            'snippets/form',
            {
                title: `Add Snippet for ${character.name} - Admin`,
                positions,
                textStyles,
                character
            }
        );
    }
)

router.post(
    '/add',
    async (req, res) => {
        const {title, image_url, description, image_position, image_width, text_style} = req.body;
        const {_id: campaign_id} = res.locals.campaign

        if (title) {
            const db = await eventualDb;
            const snippet = {
                campaign_id,
                title,
                image_url:      image_url || null,
                description:    description || null,
                image_position: image_position || null,
                image_width:    image_width || null,
                text_style:     text_style || null,
                active:         false,
            };
            const {insertedId: _id} = await db.collection('snippets').insertOne(snippet)
            res.redirect(req.baseUrl);

            const adminUsers = await db.collection('users').find({roles: 'Admin'}).toArray();
            dispatch({
                type:         'set-snippet',
                snippet:      {_id, ...snippet},
                _campaign_id: snippet.campaign_id,
                _for:         adminUsers.map(u => ObjectId(u._id))
            });
        }
        else {
            writeMessage(req, 'Title must be provided', 'alert');
            res.redirect(req.originalUrl)
        }

    }
)

router.get(
    '/edit/:id',
    async (req, res) => {
        addScript(res, '/javascripts/image-upload.js');

        const {id} = req.params;
        const _id = ObjectId(id);
        const db = await eventualDb;
        const snippet = await db.collection('snippets').findOne({_id})
        if (snippet) {
            res.render(
                'snippets/form',
                {
                    title: 'Edit Snippet - Admin',
                    snippet,
                    positions,
                    textStyles,
                }
            );
        }
        else {
            writeMessage(req, 'Failed to find snippet', 'warning');
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
            title,
            image_url,
            description,
            notes,
            image_position,
            image_width,
            text_style
        } = req.body;

        if (!title) {
            writeMessage(req, 'Title must be provided', 'alert');
            return res.redirect(req.originalUrl);
        }

        const db = await eventualDb;
        await db.collection('snippets').updateOne(
            {_id},
            {
                $set: {
                    title,
                    image_url:      image_url || null,
                    description:    description.trim() || null,
                    notes:          notes.trim() || null,
                    image_position: image_position || null,
                    image_width:    image_width || null,
                    text_style:     text_style || null,
                }
            }
        );
        res.redirect(req.baseUrl)

        const snippet = await db.collection('snippets').findOne({_id});
        if (snippet.active) {
            dispatch({type: 'set-active-snippet', snippet, _campaign_id: snippet.campaign_id});
        }

        const adminUsers = await db.collection('users').find({roles: 'Admin'}).toArray();
        dispatch({
            type:         'set-snippet',
            snippet,
            _for:         adminUsers.map(u => u._id),
            _campaign_id: snippet.campaign_id.toString()
        });
    }
)

router.post(
    '/delete/:id',
    async (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);
        const {_id: _campaign_id} = res.locals.campaign;

        const db = await eventualDb;

        const snippet = await db.collection('snippets').findOne({_id});

        await db.collection('snippets').deleteOne({_id});
        res.redirect(req.baseUrl);

        if (snippet.active) {
            dispatch({type: 'set-active-snippet', snippet: null, _campaign_id})
        }

        const adminUsers = await db.collection('users').find({roles: 'Admin'}).toArray();
        dispatch({
            type:         'remove-snippet',
            snippet_id:   _id,
            _for:         adminUsers.map(u => u._id),
            _campaign_id: _campaign_id.toString()
        });
    }
)

router.post(
    '/set-active/:id',
    async (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);
        const {_id: campaign_id} = res.locals.campaign

        const db = await eventualDb;

        await db.collection('snippets').updateMany({campaign_id, active: true}, {$set: {active: false}});
        await db.collection('snippets').updateMany({_id}, {$set: {active: true}});

        res.redirect(req.baseUrl)

        const snippet = await db.collection('snippets').findOne({_id});
        if (snippet) {
            dispatch({type: 'set-active-snippet', snippet, _campaign_id: snippet.campaign_id})
        }
    }
)


router.post(
    '/clear-active',
    async (req, res) => {
        const {_id: campaign_id} = res.locals.campaign

        const db = await eventualDb;

        await db.collection('snippets').updateMany({campaign_id, active: true}, {$set: {active: false}});

        res.redirect(req.baseUrl)
        dispatch({type: 'set-active-snippet', snippet: null, _campaign_id: campaign_id})
    }
)


registerAsyncEpic(async msg$ => {
    const db = await eventualDb;

    return msg$.pipe(
        ofType('user-connected'),
        filter(({user}) => (user.roles || []).includes('Admin')),
        mergeMap(async ({user, _campaign_id}) => {
            const snippets = await db.collection('snippets')
                                     .find({campaign_id: ObjectId(_campaign_id)})
                                     .toArray();

            return snippets.map(snippet => ({
                type: 'set-snippet',
                _for: [user._id],
                _campaign_id,
                snippet
            }));
        }),
        mergeMap((arr) => of(...arr))
    );
});

registerAsyncEpic(
    async msg$ => {
        const db = await eventualDb;

        return msg$.pipe(
            ofType('update-snippet'),
            filter(({_sender}) => (_sender.roles || []).includes('Admin')),
            mergeMap(async ({snippet, _campaign_id}) => {
                const _id = ObjectId(snippet._id);

                const {notes} = snippet;

                await db.collection('snippets').updateOne(
                    {_id, campaign_id: ObjectId(_campaign_id)},
                    {$set: {notes: notes.trim() || null}}
                );

                const adminUsers = await db.collection('users').find({roles: 'Admin'}).toArray();
                return ({
                    type: 'set-snippet',
                    snippet,
                    _campaign_id,
                    _for: adminUsers.map(u => u._id)
                });
            }),
            mergeMap((promise) => of(promise))
        );
    });

registerAsyncEpic(
    async msg$ => {
        const db = await eventualDb;

        return msg$.pipe(
            ofType('update-active-snippet'),
            filter(({_sender}) => (_sender.roles || []).includes('Admin')),
            mergeMap(async ({snippet_id, _campaign_id}) => {
                await db.collection('snippets')
                        .updateMany(
                            {active: true, campaign_id: ObjectId(_campaign_id)},
                            {$set: {active: false}}
                        );

                if (snippet_id) {
                    const _id = ObjectId(snippet_id);
                    await db.collection('snippets')
                            .updateOne({
                                _id,
                                campaign_id: ObjectId(_campaign_id)
                            }, {$set: {active: true}});
                    const snippet = await db.collection('snippets')
                                            .findOne({_id, campaign_id: ObjectId(_campaign_id)});

                    return of({type: 'set-active-snippet', _campaign_id, snippet})
                }

                return of({type: 'set-active-snippet', _campaign_id, snippet: null})
            })
        );
    }
);

module.exports = router;
