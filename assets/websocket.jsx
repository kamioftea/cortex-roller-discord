import {partition} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';
import {delay, filter, map, repeatWhen, retryWhen} from 'rxjs/operators';
import {
    CLEAR_ROLL,
    ROLL_DICE, rollCleared, rollUpdated,
    SET_DICE, UPDATE_RESULT
} from './roll';
import {TRIGGER_SCENE_CHANGE} from './sceneChange';
import {ofType} from 'redux-observable';
import {setUser} from './user';
import {ALTER_PLOT_POINTS, ALTER_STRESS, setCharacterPlayer, setCharacters} from './character';
import {
    removeSnippet,
    setActiveSnippet,
    setSnippet,
    UPDATE_ACTIVE_SNIPPET,
    UPDATE_SNIPPET
} from './snippet';
import {removeAsset, setAsset} from './asset';

const RECONNECT_DELAY_MS = 5000;

//noinspection JSUnresolvedFunction


const PING = Symbol('ping');
const PONG = Symbol('pong');

const ping = () => ({type: PING});
const pong = () => ({type: PONG});

const sendSocketTypes = {
    [SET_DICE]:              'set-dice',
    [ROLL_DICE]:             'roll-dice',
    [UPDATE_RESULT]:         'update-result',
    [TRIGGER_SCENE_CHANGE]:  'trigger-scene-change',
    [PONG]:                  'pong',
    [CLEAR_ROLL]:            'clear-roll',
    [ALTER_PLOT_POINTS]:     'alter-plot-points',
    [ALTER_STRESS]:          'alter-stress',
    [UPDATE_SNIPPET]:        'update-snippet',
    [UPDATE_ACTIVE_SNIPPET]: 'update-active-snippet',
};

const recvSocketTypes = {
    'roll-updated':         rollUpdated,
    'ping':                 ping,
    'set-user':             setUser,
    'set-characters':       setCharacters,
    'set-character-player': setCharacterPlayer,
    'roll-cleared':         rollCleared,
    'set-active-snippet':   setActiveSnippet,
    'set-snippet':          setSnippet,
    'remove-snippet':       removeSnippet,
    'set-asset':            setAsset,
    'remove-asset':         removeAsset,
};

export const websocketPingResponseEpic = action$ => action$.pipe(ofType(PING), map(pong));

export const webSocketEpic = url => action$ => {
    const socket$ = webSocket(url);
    const reconnectingSocket$ =
        socket$.pipe(
            retryWhen(error$ => error$.pipe(delay(RECONNECT_DELAY_MS))),
            repeatWhen(done$ => done$.pipe(delay(RECONNECT_DELAY_MS)))
        );

    const wsPush = msg => socket$.next(msg);

    action$
        .pipe(
            filter(action => sendSocketTypes.hasOwnProperty(action.type)),
            map(action => ({
                ...action,
                type: sendSocketTypes[action.type]
            }))
        )
        .subscribe(wsPush);

    const [valid$, invalid$] = partition(
        reconnectingSocket$,
        msg => recvSocketTypes.hasOwnProperty(msg.type)
    );

    invalid$.subscribe(msg => console.error('Received message from WebSocket without a valid Type', msg));

    return valid$.pipe(map(msg => recvSocketTypes[msg.type](msg)))
};
