import React from "react";
import {connect} from "react-redux";
import {Map, Record} from 'immutable';
import {Dice, Die, DisplaySize, Mode} from './dice';
import {Dropdown, Position, preventDefault} from './util.jsx';

export const SET_DICE = Symbol('set-dice');
export const ROLL_DICE = Symbol('roll-dice');
export const UPDATE_RESULT = Symbol('update-result');
const ROLL_UPDATED = Symbol('roll-updated');
export const CLEAR_ROLL = Symbol('clear-roll');
const ROLL_CLEARED = Symbol('roll-cleared');

export const Roll = Record({
    character_id: '',
    dice_pool:    Map(),
    selected:     null,
    effect:       null,
    ignored:      null,
    hitches:      null,
    resources:    null,
    total:        null,
    name:         '',
    icon_url:     '',
})

export const setDice = (character_id, key, label, dice, order) => ({
    type: SET_DICE,
    character_id,
    key,
    label,
    dice,
    order
});
const rollDice = (character_id) => ({type: ROLL_DICE, character_id});
const updateResult = (character_id, source, index, target) => ({
    type: UPDATE_RESULT,
    character_id,
    source,
    index,
    target,
});
export const rollUpdated = ({character_id, roll}) =>
    ({
        type: ROLL_UPDATED,
        character_id,
        roll: Roll(roll)
    });
const clearRoll = (character_id) => ({type: CLEAR_ROLL, character_id});
export const rollCleared = ({character_id}) => ({type: ROLL_CLEARED, character_id});

export const rollsReducer = (state = new Map(), action) => {
    switch (action.type) {
        case ROLL_UPDATED:
            return state.set(action.character_id, action.roll);

        case ROLL_CLEARED:
            return state.remove(action.character_id);

        default:
            return state;
    }
}

const DisplayRoll = connect(
    ({}) => ({}),
    {setDice, rollDice, updateResult, clearRoll}
)(({
       roll, isEditable = false,
       setDice, rollDice, updateResult, clearRoll
   }) => {

        function buildDiceOptions(key, label, index, dice) {
            function copySplice(arr, start, length, ...replace) {
                return [
                    ...arr.slice(0, start),
                    ...replace,
                    ...arr.slice(start + length)
                ]
            }

            return {
                remove: <div className="clickable"
                             onClick={preventDefault(() => setDice(roll.character_id, key, label, copySplice(dice, index, 1)))}>
                            Remove
                        </div>,
                double: <div className="clickable"
                             onClick={preventDefault(() => setDice(roll.character_id, key, label, copySplice(dice, index, 0, dice[index])))}>
                            Double
                        </div>,
                switch: <div className="">
                            {[Dice.D4, Dice.D6, Dice.D8, Dice.D10, Dice.D12]
                                .filter(d => d !== dice[index])
                                .map(d => <div className="clickable inline" key={d}>
                                    <Die sides={d}
                                         displaySize={DisplaySize.SMALL}
                                         onClick={preventDefault(() => setDice(roll.character_id, key, label, copySplice(dice, index, 1, d)))}
                                    />
                                </div>)
                            }
                        </div>
            }
        }

        const renderResultOption = (source, index, target, label) =>
            <div className="clickable"
                 onClick={preventDefault(() => updateResult(
                     roll.character_id,
                     source,
                     index,
                     target
                 ))}>
                {label}
            </div>;

        return <div className="card">
            <div className="card-divider">
                <div className="grid-x grid-margin-x">
                    <div className="cell auto">
                        <h3>
                            {roll.icon_url
                                ? <img src={roll.icon_url} style={{height: '2.5rem'}}
                                       alt={roll.name + ' Icon'}/>
                                : null
                            } {' '}
                            {roll.name}
                        </h3>
                    </div>
                    <div className="cell shrink text-right">
                        {isEditable
                            ? <div>
                                <button className="button small primary"
                                        onClick={preventDefault(() => rollDice(roll.character_id))}
                                >
                                    <i className="far fa-dice"/>{' '}
                                    Roll
                                </button>
                                <button className="button small alert"
                                        onClick={preventDefault(() => clearRoll(roll.character_id))}
                                >
                                    <i className="far fa-times"/>{' '}
                                </button>
                            </div>
                            : null
                        }
                    </div>
                </div>
            </div>
            <div className="card-section">
                <div className="grid-x grid-padding-x grid-padding-y">
                    <div className="cell small-12 medium-6">
                        {Object.entries(roll.dice_pool || {})
                               .sort(([, a], [, b]) =>
                                   a.order !== b.order
                                       ? a.order - b.order
                                       : a.label.localeCompare(b.label)
                               )
                               .map(([key, {label, dice}]) =>
                                   <div className='dice-pool-row' key={key}>
                                       <div className="dice-pool-label">
                                           {label}
                                       </div>
                                       <div className="dice-pool-dice">
                                           {dice.map((die, index) =>
                                               <Dropdown
                                                   key={index}
                                                   position={Position.RIGHT}
                                                   options={buildDiceOptions(key, label, index, dice)}
                                                   disabled={!isEditable}
                                               >
                                                   <Die sides={die}
                                                        displaySize={DisplaySize.MEDIUM}
                                                        key={index}
                                                   />
                                               </Dropdown>
                                           )}
                                       </div>
                                   </div>
                               )
                        }
                    </div>
                    <div className="cell small-12 medium-6">
                        {roll.total != null
                            ? <div className='dice-pool-row'>
                                <div className="dice-pool-label">
                                    {roll.total > 0 ? `Total ${roll.total}` : 'Botch!'}
                                </div>
                                <div className="dice-pool-dice">
                                    {(roll.selected || []).map(([sides, value], index) =>
                                        <Dropdown key={index}
                                                  position={Position.RIGHT}
                                                  options={{
                                                      toEffect:  renderResultOption(
                                                          'selected',
                                                          index,
                                                          'effect',
                                                          'Move to Effect'
                                                      ),
                                                      toIgnored: renderResultOption(
                                                          'selected',
                                                          index,
                                                          'ignored',
                                                          'Remove from Selected'
                                                      ),
                                                  }}
                                        >
                                            <Die sides={sides}
                                                 value={value}
                                                 displaySize={DisplaySize.MEDIUM}
                                                 mode={Mode.SELECTED}
                                            />
                                        </Dropdown>
                                    )}
                                </div>
                            </div>
                            : null
                        }
                        {roll.effect != null
                            ? <div className='dice-pool-row'>
                                <div className="dice-pool-label">
                                    Effect
                                </div>
                                <div className="dice-pool-dice">
                                    {roll.effect.length > 0
                                        ? roll.effect.map(([sides, value], index) =>
                                            <Dropdown key={index}
                                                      position={Position.RIGHT}
                                                      options={{
                                                          toEffect:  renderResultOption(
                                                              'effect',
                                                              index,
                                                              'selected',
                                                              'Move to Selected'
                                                          ),
                                                          toIgnored: renderResultOption(
                                                              'effect',
                                                              index,
                                                              'ignored',
                                                              'Remove from Effect'
                                                          ),
                                                      }}
                                            >
                                                <Die sides={sides}
                                                     value={value}
                                                     displaySize={DisplaySize.MEDIUM}
                                                     mode={Mode.EFFECT}
                                                />
                                            </Dropdown>
                                        )
                                        : <Die sides={Dice.D4}
                                               displaySize={DisplaySize.MEDIUM}
                                               mode={Mode.IGNORED}
                                        />
                                    }
                                </div>
                            </div>
                            : null
                        }
                        {roll.ignored && roll.ignored.length > 0
                            ? <div className='dice-pool-row'>
                                <div className="dice-pool-label">
                                    Unused
                                </div>
                                <div className="dice-pool-dice">
                                    {roll.ignored.map(([sides, value], index) =>
                                        <Dropdown key={index}
                                                  position={Position.RIGHT}
                                                  options={{
                                                      toEffect:  renderResultOption(
                                                          'ignored',
                                                          index,
                                                          'selected',
                                                          'Move to Selected'
                                                      ),
                                                      toIgnored: renderResultOption(
                                                          'ignored',
                                                          index,
                                                          'effect',
                                                          'Move to Effect'
                                                      ),
                                                  }}
                                        >
                                            <Die key={index}
                                                 sides={sides}
                                                 value={value}
                                                 displaySize={DisplaySize.MEDIUM}
                                                 mode={Mode.IGNORED}
                                            />
                                        </Dropdown>
                                    )
                                    }
                                </div>
                            </div>
                            : null
                        }
                        {roll.hitches && roll.hitches.length > 0
                            ? <div className='dice-pool-row'>
                                <div className="dice-pool-label">
                                    Hitches
                                </div>
                                <div className="dice-pool-dice">
                                    {roll.hitches.map(([sides, value], index) =>
                                        <Die key={index}
                                             sides={sides}
                                             value={value}
                                             displaySize={DisplaySize.MEDIUM}
                                             mode={Mode.HITCH}
                                        />
                                    )}
                                </div>
                            </div>
                            : null
                        }
                    </div>
                </div>
            </div>
        </div>
    }
);


export const Rolls = connect(
    (
        {rolls, currentCharacter, user}
    ) => (
        {rolls, currentCharacter, user}
    ),
    {}
)((
    {rolls, currentCharacter, user}
    ) => {

        return <div className="grid-x grid-padding-x grid-padding-y">
            {rolls.toArray()
                  .sort((a, b) => {
                      // Current character first, otherwise by name
                      if (a.character_id === b.character_id) {
                          return 0;
                      }
                      if (a.character_id === currentCharacter?._id) {
                          return -1;
                      }
                      if (b.character_id === currentCharacter?._id) {
                          return 1;
                      }

                      return a.name.localeCompare(b.name)
                  })
                  .map((roll, index) =>
                      <div className="cell small-12" key={index}>
                          <DisplayRoll roll={roll}
                                       isEditable={
                                           (user.roles || []).includes('Admin')
                                           || currentCharacter?._id === roll?.character_id
                                       }
                          />
                      </div>
                  )}
        </div>
    }
)

export const DiceBlock = connect(
    ({currentCharacter, rolls}) => ({currentCharacter, rolls}),
    {setDice}
)(({currentCharacter, rolls, setDice}) => {
        if (!currentCharacter) {
            return null;
        }

        const roll = rolls.get(currentCharacter._id) || Roll();

        // noinspection JSUnresolvedVariable
        const addDieToOther = (die) =>
            setDice(
                currentCharacter._id,
                'other',
                'Other',
                (roll && roll.dice_pool.other ? roll.dice_pool.other.dice : []).concat([die]),
                99
            );

        return <fieldset>
            <legend>Additional Dice</legend>
            <div className="grid-x grid-margin-x small-up-5">
                {Object.values(Dice)
                       .filter(die => !isNaN(die))
                       .map(die =>
                           <div className="cell" key={die}>
                               <div className="clickable text-center">
                                   <Die sides={die}
                                        displaySize={DisplaySize.MEDIUM}
                                        onClick={preventDefault(() => addDieToOther(die))}
                                   />
                               </div>
                           </div>
                       )
                }
            </div>
        </fieldset>;
    }
);
