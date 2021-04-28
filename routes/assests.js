const express = require('express');
const router = express.Router();
const {ObjectId} = require('mongodb');
const {eventualDb} = require('../db-conn.js');
const {writeMessage} = require('../flashMessage.js');
const {authenticated} = require('../authenticateRequest');
const {dispatch, registerAsyncEpic} = require('../model');
const {addScript, addStyle, diceOptions} = require('../util');

const {ofType} = require('redux-observable');
const {of} = require('rxjs');
const {mergeMap} = require('rxjs/operators');

router.use(authenticated('Admin'));

router.use((req, res, next) => {
    res.locals.base_url = req.baseUrl;
    next();
})

/* GET snippet list page. */
router.get('/', async function (req, res) {
    const db = await eventualDb;
    const assets = await db.collection('assets').find().sort({label: 1}).toArray();
    const characters = await db.collection('characters').find()
                               .sort({name: 1})
                               .toArray();

    const characterOptions = [...characters].map(
        ({_id, name}) => ({value: _id, label: name})
    );


    addScript(res, '/javascripts/assets/list.js');
    // noinspection SpellCheckingInspection
    addScript(
        res,
        {
            src:         'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js',
            integrity:   'sha512-2ImtlRlf2VVmiGZsjm9bEyhjGW4dU7B6TNwh/hx/iSByxNENtj3WVE6o/9Lj4TJeVXPi4bnOIMXFIJJAeufa0A==',
            crossorigin: "anonymous",
        }
    );
    // noinspection SpellCheckingInspection
    addStyle(
        res,
        {
            rel:         "stylesheet",
            href:        'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css',
            integrity:   'sha512-nMNlpuaDPrqlEls3IX/Q56H36qvBASwb3ipuo3MxeWbsQB1881ox0cRv7UPTgBlriqoynt35KjEwgGUeUXIPnw==',
            crossOrigin: 'anonymous',
        }
    )

    res.render(
        'assets/list',
        {
            title: 'Temporary Assets - Admin',
            assets,
            diceOptions,
            characterOptions
        }
    );
});

router.post(
    '/add',
    async (req, res) => {
        const {label, die} = req.body;

        if (label && die) {
            const db = await eventualDb;
            const {insertedId: _id} = await db.collection('assets').insertOne({
                label,
                die,
            })

            res.redirect(req.baseUrl);

            dispatch({type: 'set-asset', asset: {_id, label, die}});
        }
        else {
            writeMessage(req, 'Label and die must be provided', 'alert');
            res.redirect(req.baseUrl)
        }
    }
)

router.post(
    '/edit/:id',
    async (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const updates = Object.fromEntries(
            Object.entries(req.body)
                  .filter(([k, v]) => ['label', 'die', 'characterIds'].includes(k) && v !== undefined)
        );

        if (Object.values(updates).length === 0) {
            return res.json({success: false, message: 'Nothing to update'});
        }

        const db = await eventualDb;
        await db.collection('assets').updateOne(
            {_id},
            {
                $set: updates // Only include valid keys that are not undefined
            }
        );
        res.json({success: true});

        const asset = await db.collection('assets').findOne({_id});
        dispatch({type: 'set-asset', asset});
    }
)

router.post(
    '/delete/:id',
    async (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const db = await eventualDb;
        await db.collection('assets').deleteOne({_id});
        res.redirect(req.baseUrl);

        dispatch({type: 'remove-asset', _id});
    }
)

registerAsyncEpic(async msg$ => {
    const db = await eventualDb;

    return msg$.pipe(
        ofType('user-connected'),
        mergeMap(async ({user}) => {
            const assets = await db.collection('assets').find().toArray();
            return assets
                .map(asset => ({
                    type:         'set-asset',
                    _for:         [user._id],
                    asset,
                }));
        }),
        mergeMap((arr) => of(...arr))
    );
});

module.exports = router;
