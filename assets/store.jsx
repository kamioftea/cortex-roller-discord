import {createEpicMiddleware, combineEpics} from "redux-observable";
import {applyMiddleware, combineReducers, createStore} from "redux";
import {EMPTY} from "rxjs";
import {rollsReducer} from './roll';
import {webSocketEpic, websocketPingResponseEpic} from './websocket';
import {userReducer} from './user';
import {characterPlayerEpic, charactersReducer, currentCharacterReducer} from './character';
import {snippetReducer} from './snippet';

const rootReducer = combineReducers(
    {
        rolls:            rollsReducer,
        user:             userReducer,
        characters:       charactersReducer,
        currentCharacter: currentCharacterReducer,
        snippet:          snippetReducer,
    }
);

const loggingEpic = action$ => {
    action$.subscribe(msg => console.log(new Date, msg));

    return EMPTY;
};

export const buildStore = (websocketUrl) => {
    const rootEpic = combineEpics(
        loggingEpic,
        webSocketEpic(websocketUrl),
        websocketPingResponseEpic,
        characterPlayerEpic,
    );

    const epicMiddleware = createEpicMiddleware();

    const store = createStore(
        rootReducer,
        applyMiddleware(epicMiddleware)
    );

    epicMiddleware.run(rootEpic);

    return store;
}
