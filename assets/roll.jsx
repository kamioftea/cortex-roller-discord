import React from "react";
import {connect} from "react-redux";
import {List, Map, Record} from 'immutable';
import {Dice, Die, DisplaySize, Mode} from './dice';
import {Dropdown, preventDefault} from './util.jsx';
import {setCurrentCharacter} from './character';

const ADD_DIE = Symbol('add-die');
const REMOVE_DIE = Symbol('remove-die');
const RESET_DICE = Symbol('reset-dice');
const ADD_RESOURCE = Symbol('add-resource');
const REMOVE_RESOURCE = Symbol('remove-resource');
export const ROLL_DICE = Symbol('roll-dice');
const DICE_ROLLED = Symbol('dice-rolled');
export const CLEAR_RESULT = Symbol('clear-result');
const RESULT_CLEARED = Symbol('result-cleared');

const addDie = (sides) => ({type: ADD_DIE, sides});
const removeDie = (index) => ({type: REMOVE_DIE, index});
const resetDice = () => ({type: RESET_DICE});
// noinspection JSUnusedLocalSymbols
const addResource = () => ({type: ADD_RESOURCE});
// noinspection JSUnusedLocalSymbols
const removeResource = () => ({type: REMOVE_RESOURCE});
const rollDice = (dice, resources = 0, rollAs) => ({type: ROLL_DICE, dice, resources, rollAs});
const diceRolled = (result, user) => ({type: DICE_ROLLED, result, user});
const clearResult = (user) => ({type: CLEAR_RESULT, user_id: user._id});
export const resultCleared = ({user_id}) => ({type: RESULT_CLEARED, user_id});

const RollSpec = Record({
    roll:     List(),
    resource: 0,
})

export const currentRollReducer = (state = RollSpec(), action) => {
    switch (action.type) {
        case ADD_DIE:
            return RollSpec({
                roll:     state.roll.push(action.sides),
                resource: state.resource,
            });

        case REMOVE_DIE:
            return RollSpec({
                roll:     state.roll.delete(action.index),
                resource: state.resource,
            });

        case ADD_RESOURCE:
            return {
                roll:     state.roll,
                resource: state.resource + 1,
            };

        case REMOVE_RESOURCE:
            return {
                roll:     state.roll,
                resource: Math.max(0, state.resource - 1),
            };

        case ROLL_DICE:
        case RESET_DICE:
            return RollSpec();

        default:
            return state;
    }
}

const RollResult = Record({
    selected:  List(),
    effect:    List(),
    ignored:   List(),
    hitches:   List(),
    resources: List(),
    name:      '',
    icon_url:  '',
})

export const handleDiceRolled =
    ({
         roll: {selected, effect, ignored, hitches, resources},
         user,
         rollAs
     }) =>
        diceRolled(
            RollResult({
                selected:  List(selected),
                effect:    List(effect),
                ignored:   List(ignored),
                hitches:   List(hitches),
                resources: List(resources),
                name:      rollAs.name,
                icon_url:  rollAs.icon_url,
            }),
            user
        )

export const rollResultsReducer = (state = new Map(), action) => {
    switch (action.type) {
        case DICE_ROLLED:
            return state.set(action.user._id, action.result);

        case RESULT_CLEARED:
            return state.remove(action.user_id);

        default:
            return state;
    }
}

export const Roller = connect(
    ({currentRoll, rollResults, user, characters, currentCharacter}) =>
        ({currentRoll, rollResults, user, characters, currentCharacter}),
    {addDie, removeDie, resetDice, rollDice, clearResult, setCurrentCharacter}
)(({
       currentRoll, rollResults, user, characters, currentCharacter,
       addDie, removeDie, resetDice, rollDice, clearResult, setCurrentCharacter
   }) => {
        const rollResult = user != null && rollResults.has(user._id)
            ? rollResults.get(user._id)
            : null;

        const characterOptions =
            Object.fromEntries(characters.map(character =>
                [
                    character.name,
                    <div onClick={() => setCurrentCharacter(character)} style={{cursor: 'pointer'}}>
                        <h3>{character.name}{' '}
                            {character.icon_url
                                ? <img src={character.icon_url} style={{height: '2.5rem'}}
                                       alt={character.name + ' icon'}/>
                                : null
                            }
                        </h3>
                    </div>
                ]
            ))

        if (!currentCharacter) {
            if (characters.size === 0) {
                return <div>
                    <h2>Cortex Roller</h2>
                    <p>Please wait, a character will be assigned to you</p>
                </div>
            }

            return <div className="grid-x grid-margin-x grid-margin-y">
                <div className="cell small-6">
                    <h2>Cortex Roller</h2>
                </div>
                <div className="cell small-6 text-right">
                    <Dropdown options={characterOptions}>
                        <h3>Choose a character...</h3>
                    </Dropdown>
                </div>
            </div>
        }

        const rollAs = {
            name:     currentCharacter.name,
            icon_url: currentCharacter.icon_url,
        };

        return <div>
            <div className="grid-x grid-margin-x grid-margin-y">
                <div className="cell small-6">
                    <h2>Cortex Roller</h2>
                </div>
                <div className="cell small-6 text-right">
                    <Dropdown options={characterOptions} disabled={characters.size === 1}>
                        <h3>{currentCharacter.name}{' '}
                            {currentCharacter.icon_url
                                ? <img src={currentCharacter.icon_url} style={{height: '2.5rem'}}
                                       alt={currentCharacter.name + ' icon'}/>
                                : null
                            }
                        </h3>
                    </Dropdown>
                </div>
            </div>

            <div className="grid-x grid-margin-x grid-margin-y">
                {[Dice.D4, Dice.D6, Dice.D8, Dice.D10, Dice.D12].map(sides =>
                    <div className="cell small-4 medium-2 text-center"
                         key={sides}
                    >
                        <Die sides={sides}
                             displaySize={DisplaySize.LARGE}
                             style={{cursor: 'copy'}}
                             onClick={() => addDie(sides)}
                        />
                    </div>
                )}
            </div>
            {currentRoll.roll.size > 0 || currentRoll.resource > 0
                ? <div>
                    <h2>Roll:</h2>
                    <div>
                        {currentRoll.roll.toJS().map((sides, index) =>
                            <Die key={index}
                                 sides={sides}
                                 displaySize={DisplaySize.MEDIUM}
                                 style={{cursor: 'pointer'}}
                                 onClick={() => removeDie(index)}
                            />
                        )}
                    </div>
                    <br/>
                    <p>
                        <a href='#'
                           className='button primary'
                           onClick={preventDefault(() => rollDice(currentRoll.roll, currentRoll.resource, rollAs))}
                        >
                            <i className="far fa-dice"/>{' '}
                            Roll...
                        </a>{' '}
                        <a href='#'
                           className='button alert'
                           onClick={preventDefault(resetDice)}
                        >
                            <i className="far fa-trash"/>{' '}
                            Clear
                        </a>
                    </p>
                </div>
                : null
            }
            {rollResult != null
                ? <div>
                    <h2>Result:</h2>
                    <DisplayRollResult rollResult={rollResult}/>
                    <p>
                        <a href='#'
                           className='button primary'
                           onClick={preventDefault(() =>
                               rollDice(
                                   [
                                       ...rollResult.selected,
                                       // Filter out default d4 when not enough dice
                                       ...rollResult.effect,
                                       ...rollResult.ignored,
                                       ...rollResult.hitches
                                   ].map(([sides,]) => sides),
                                   rollResult.resources.size,
                                   rollAs
                               )
                           )}
                        >
                            <i className="far fa-redo-alt"/>{' '}
                            Re-roll...
                        </a>
                        {' '}
                        <a href='#'
                           className='button alert'
                           onClick={preventDefault(() => clearResult(user))}>
                            <i className="far fa-trash-alt"/>{' '}
                            Clear
                        </a>
                    </p>
                </div>
                : null
            }
        </div>;
    }
)

const DisplayRollResult = ({rollResult, displaySize = DisplaySize.MEDIUM}) => <div
    className='roll-result'>
    <div>
        {rollResult.selected.toJS().map(([sides, value], index) =>
            <Die key={index}
                 sides={sides}
                 value={value}
                 mode={Mode.SELECTED}
                 displaySize={displaySize}
            />
        )}
        {rollResult.effect.toJS().map(([sides, value], index) =>
            <Die key={index}
                 sides={sides}
                 value={value}
                 mode={Mode.EFFECT}
                 displaySize={displaySize}
            />
        )}
        {rollResult.ignored.toJS().map(([sides, value], index) =>
            <Die key={index}
                 sides={sides}
                 value={value}
                 mode={Mode.IGNORED}
                 displaySize={displaySize}
            />
        )}
        {rollResult.hitches.toJS().map(([sides, value], index) =>
            <Die key={index}
                 sides={sides}
                 value={value}
                 mode={Mode.HITCH}
                 displaySize={displaySize}
            />
        )}
        {rollResult.resources.size > 0
            ? <span>
                                <span className="dice-divider">+</span>
                {rollResult.resources.toJS().map((value, index) =>
                    <Die key={index}
                         sides={Dice.D6}
                         value={value}
                         mode={index === 0 ? Mode.SELECTED : Mode.IGNORED}
                         displaySize={displaySize}
                    />
                )}
                            </span>
            : null
        }
    </div>
    <p>
        Total:
        {
            rollResult.selected.reduce((acc, [, value]) => acc + value, 0)
            + (rollResult.resources.first() || 0)
        },
        Effect:
        {
            (rollResult.effect.size > 0 ? [...rollResult.effect.toJS()] : [[4]]).map(
                ([sides,], index) =>
                    <Die key={index}
                         mode={Mode.EFFECT}
                         sides={sides}
                         displaySize={DisplaySize.SMALL}
                    />
            )
        }
    </p>
</div>


export const Rolls = connect(
    ({rollResults}) => ({rollResults}),
    {}
)(({rollResults}) => {

    return <div>
        {rollResults
            .toArray()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((res, user_id) =>
                <div className="card" key={user_id}>
                    <div className="card-divider">
                        <h3>
                            {res.icon_url
                                ? <img src={res.icon_url} style={{height: '2.5rem'}}
                                       alt={res.name + ' Icon'}/>
                                : null
                            } {' '}
                            {res.name}
                        </h3>
                    </div>
                    <div className="card-section">
                        <DisplayRollResult rollResult={res} displaySize={DisplaySize.SMALL}/>
                    </div>
                </div>
            )}
    </div>
})
