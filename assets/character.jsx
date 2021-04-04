import {List, Record} from 'immutable';
import {ofType} from 'redux-observable';
import {map, withLatestFrom} from 'rxjs/operators';

const SET_CHARACTERS = Symbol('set-characters');
const SET_CHARACTER_PLAYER = Symbol('set-character-player');
const SET_CURRENT_CHARACTER = Symbol('set-current-character');

const Character = Record({
    name:            '',
    icon_url:        null,
    image_url:       null,
    plot_points:     1,
    stress:          {},
    attributes:      {},
    catalyst_die:    null,
    values:          {},
    distinctions:    {},
    specialities:    {},
    signature_asset: {},
});

export const setCharacters = ({characters}) => ({
    type:       SET_CHARACTERS,
    characters: List((characters || []).map(c => Character(c))),
});

export const setCharacterPlayer = ({user_id, character}) => ({
    type:      SET_CHARACTER_PLAYER,
    user_id,
    character: Character(character),
});

export const setCurrentCharacter = (character) => ({type: SET_CURRENT_CHARACTER, character});

export const characterPlayerEpic =
    (action$, state$) =>
        action$.pipe(
            ofType(SET_CHARACTER_PLAYER),
            withLatestFrom(state$),
            map(([{user_id, character}, {characters, user}]) => {
                const filtered = characters.filter(c => c.name !== character.name);
                return setCharacters({
                    characters: user_id === user._id ? filtered.push(character) : filtered
                });
            })
        );

export function charactersReducer(state = new List(), action) {
    switch (action.type) {
        case SET_CHARACTERS:
            console.log(action.characters.toJS());

            return action.characters;

        default:
            return state;
    }
}

export function currentCharacterReducer(state = null, action) {
    switch (action.type) {
        case SET_CHARACTERS:
            return action.characters.size === 1
                ? action.characters.first()
                : (action.characters.some(c => state && c.name === state.name) ? state : null);

        case SET_CURRENT_CHARACTER:
            return action.character;

        default:
            return state;
    }
}
