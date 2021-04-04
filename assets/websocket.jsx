import {partition} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';
import {delay, filter, map, repeatWhen, retryWhen} from 'rxjs/operators';
import {CLEAR_RESULT, handleDiceRolled, resultCleared, ROLL_DICE} from './roll';
import {TRIGGER_SCENE_CHANGE} from './sceneChange';
import {ofType} from 'redux-observable';
import {setUser} from './user';
import {setCharacterPlayer, setCharacters} from './character';
import {setSnippet} from './snippet';

const RECONNECT_DELAY_MS = 5000;

//noinspection JSUnresolvedFunction


const PING = Symbol('ping');
const PONG = Symbol('pong');

const ping = () => ({type: PING});
const pong = () => ({type: PONG});

const sendSocketTypes = {
    [ROLL_DICE]:            'roll-dice',
    [TRIGGER_SCENE_CHANGE]: 'trigger-scene-change',
    [PONG]:                 'pong',
    [CLEAR_RESULT]:         'clear-result',
};

const recvSocketTypes = {
    'dice-rolled':          handleDiceRolled,
    'ping':                 ping,
    'set-user':             setUser,
    'set-characters':       setCharacters,
    'set-character-player': setCharacterPlayer,
    'result-cleared':       resultCleared,
    'set-active-snippet':   setSnippet,
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
