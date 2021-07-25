const {Observable, Subject, EMPTY, merge} = require('rxjs');
const {map, mergeMap} = require('rxjs/operators');
const {ofType} = require('redux-observable');
const fetch = require('node-fetch');
const {eventualDb} = require('./db-conn');

const message$ = new Subject();

function registerEpic(epic) {
    const result$ = epic(message$);

    if (!result$ instanceof Observable) {
        console.error('Expected epic to return an Observable')
    }

    const resultSubscription = result$.subscribe(msg => message$.next(msg));

    return {
        unsubscribe() {
            console.log('unsubscribing');
            resultSubscription.unsubscribe();
        }
    }
}


function registerAsyncEpic(epic) {
    const eventualResult = epic(message$);

    let resultSubscription = null;

    eventualResult.then(result$ => {
        if (!result$ instanceof Observable) {
            console.error('Expected epic to return an Observable')
        }

        resultSubscription = result$.subscribe(msg => message$.next(msg));
    });

    return {
        unsubscribe() {
            console.log('unsubscribing');
            resultSubscription && resultSubscription.unsubscribe();
        }
    }
}

function dispatch(msg) {
    message$.next(msg)
}

const postToDiscord = (msg) => {
    if (!process.env.DICE_ROLL_URL) {
        return;
    }

    const url = new URL(process.env.DICE_ROLL_URL);

    fetch(
        url,
        {
            method:  'post',
            body:    JSON.stringify(msg),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
        .then(res => res.text())
        .then(text => {
            if (text) {
                console.log('from Discord: ' + text)
            }
        })

}

registerEpic(
    (msg$) => {
        msg$.pipe(ofType('dice-rolled'))
            .subscribe(({roll, user, rollAs}) => {
                let author;
                if (rollAs) {
                    author = rollAs;
                }
                else {
                    if (user.discordProfile) {
                        // noinspection JSUnresolvedVariable
                        author = {
                            name:     user.discordProfile.username,
                            icon_url: `https://cdn.discordapp.com/avatars/${user.discordProfile.id}/${user.discordProfile.avatar}`
                        };
                    }
                    else {
                        author = {name: user.name}
                    }
                }

                const embed = {
                    author,
                    type:   'rich',
                    fields: []
                };

                embed.fields.push({
                    name:   'Rolled',
                    value:
                            roll.selected.length > 0
                                ? `${roll.selected.map(([s, v]) => `${v}(d${s})`)
                                .concat(roll.resources[0] ? [`${roll.resources[0]}(Res)`] : [])
                                .join(' + ')
                                } = ${roll.selected.reduce((acc, [, v]) => acc + v, 0) + (roll.resources[0] || 0)}`
                                : 'Botch!',
                    inline: true,
                })

                embed.fields.push({
                    name:   'Effect',
                    value:  `d${(roll.effect[0] || [4])[0]}`,
                    inline: true,
                })

                if (roll.ignored.length > 0) {
                    embed.fields.push({
                        name:   'Ignored',
                        value:  roll.ignored.map(([s, v]) => `${v}(d${s})`).join(', '),
                        inline: true,
                    });
                }

                if (roll.hitches.length > 0) {
                    embed.fields.push({
                        name:   'Hitches',
                        value:  `${roll.hitches.map(([s]) => `d${s}`).join(', ')}`,
                        inline: true,
                    })
                }

                postToDiscord({embeds: [embed]});
            });

        return EMPTY;
    }
);

registerEpic(msg$ => {
    msg$.pipe(ofType('trigger-scene-change'))
        .subscribe(({action}) => postToDiscord({content: 'Script Change! ' + action}));

    return EMPTY;
})

async function lookupCharacters(user) {
    const db = await eventualDb;
    const query = (user.roles || []).includes('Admin')
        ? {}
        : {_player_id: user._id}
    const characters = await db.collection('characters').find(query).toArray();

    return {
        type:     'set-characters',
        _for: [user._id],
        characters
    }
}

async function lookupSnippet(user) {
    const db = await eventualDb;
    const snippet = await db.collection('snippets').findOne({active: true});

    return {
        type: 'set-active-snippet',
        _for: [user._id],
        snippet
    }
}

registerEpic(msg$ =>
    msg$.pipe(
        ofType('user-connected'),
        mergeMap(({user}) =>
            merge(
                lookupCharacters(user),
                lookupSnippet(user),
            )
        ),
    )
);

// transform request -> broadcast
registerEpic(msg$ =>
    msg$.pipe(
        ofType('clear-result'),
        map(({user_id}) => ({type: 'result-cleared', user_id}))
    )
)

module.exports = {registerEpic, registerAsyncEpic, dispatch};
