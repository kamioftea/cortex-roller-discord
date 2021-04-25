import React from "react";
import {connect} from "react-redux";
import {List, Record} from 'immutable';
import {ofType} from 'redux-observable';
import {map, withLatestFrom} from 'rxjs/operators';
import {Dropdown, preventDefault, renderMarkdown} from './util';
import titleCase from '../helpers/titleCase'
import {Dice, Die, DisplaySize} from './dice';
import {setDice} from './roll';

const SET_CHARACTERS = Symbol('set-characters');
const SET_CHARACTER_PLAYER = Symbol('set-character-player');
const SET_CURRENT_CHARACTER = Symbol('set-current-character');

export const ALTER_STRESS = Symbol('alter-stress');
export const ALTER_PLOT_POINTS = Symbol('alter-plot-points');

const Character = Record({
    _id:             '',
    name:            '',
    icon_url:        null,
    image_url:       null,
    description:     null,
    plot_points:     0,
    stress:          {},
    attributes:      null,
    misc:            null,
    catalyst_die:    null,
    values:          null,
    distinctions:    null,
    specialities:    null,
    signature_asset: null,
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

const alterStress = (character_id, stress_type, delta) => ({
    type: ALTER_STRESS,
    character_id,
    stress_type,
    delta,
});

const alterPlotPoints = (character_id, delta) => ({
    type: ALTER_PLOT_POINTS,
    character_id,
    delta,
});

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
                : action.characters.find(c => state && c._id === state._id) || null;

        case SET_CURRENT_CHARACTER:
            return action.character;

        default:
            return state;
    }
}

export const CharacterSelect = connect(
    ({characters, currentCharacter}) => ({characters, currentCharacter}),
    ({setCurrentCharacter})
)(({characters, currentCharacter, setCurrentCharacter}) => {
    if (characters.size === 0) {
        return <div>
            <h2>No Character Assigned</h2>
            <p>Please wait, a character will be assigned to you...</p>
        </div>
    }

    const characterOptions =
        Object.fromEntries(
            characters
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(character =>
                    [
                        character.name,
                        <div onClick={() => setCurrentCharacter(character)}
                             style={{cursor: 'pointer'}}>
                            <h3>{character.name}{' '}
                                {character.icon_url
                                    ? <img src={character.icon_url} style={{height: '2.5rem'}}
                                           alt={character.name + ' icon'}/>
                                    : null
                                }
                            </h3>
                        </div>
                    ]
                ));

    return <div>
        <Dropdown options={characterOptions} disabled={currentCharacter && characters.size === 1}>
            {currentCharacter
                ? <h2>
                    {currentCharacter.icon_url
                        ? <img src={currentCharacter.icon_url} style={{height: '3rem'}}
                               alt={currentCharacter.name + ' icon'}/>
                        : null
                    }{' '}
                    {currentCharacter.name}
                </h2>
                : <h2>Choose a character...</h2>
            }
        </Dropdown>
    </div>
})

export const Trackers = connect(
    ({currentCharacter}) => ({character: currentCharacter}),
    {alterStress, alterPlotPoints}
)(({character, alterStress, alterPlotPoints}) => {
    if (!character) {
        return null;
    }

    const stresses = ['afraid', 'angry', 'corrupted', 'exhausted', 'injured', 'insecure']

    return <div className="grid-x grid-margin-x">
        <div className="cell small-4">
            <fieldset>
                <legend>Plot Points</legend>
                <div className="grid-y grid-padding-y">
                    <div className="cell">
                        <button className="button primary expanded"
                                onClick={preventDefault(() => alterPlotPoints(character._id, +1))}
                        >
                            <i className="far fa-plus"/>
                        </button>
                    </div>
                    <div className="cell text-center">
                        <Die sides={Dice.PP}
                             displaySize={DisplaySize.LARGE}
                             value={character.plot_points || '0'}/>
                    </div>
                    <div className="cell">
                        <button
                            className={`button primary expanded ${character.plot_points ? '' : 'disabled'}`}
                            onClick={preventDefault(() => character.plot_points ? alterPlotPoints(character._id, -1) : null)}
                        >
                            <i className="far fa-minus"/>
                        </button>
                    </div>
                </div>
            </fieldset>
        </div>
        <div className="cell small-8">
            <fieldset>
                <legend>Stress</legend>
                {stresses.map(stress => {
                    const die = character.stress[stress];

                    return <div className="grid-x grid-margin-x grid-margin-y" key={stress}>
                        <div className="cell small-2">
                            <button className={`button primary small ${die ? '' : 'disabled'}`}
                                    onClick={preventDefault(() => die ? alterStress(character._id, stress, -1) : null)}
                            >
                                <i className="far fa-minus"/>
                            </button>
                        </div>
                        <div className="cell small-6">
                            <h5>{titleCase(stress)}</h5>
                        </div>
                        <div className="cell small-2 text-center">
                            {die ? <Die sides={die} displaySize={DisplaySize.SMALL}/> : '-'}
                        </div>
                        <div className="cell small-2 text-right">
                            <button
                                className={`button primary small ${die >= Dice.D12 ? 'disabled' : ''}`}
                                onClick={preventDefault(() => {
                                    console.log('hi', alterStress(character._id, stress, +1))
                                    return die >= Dice.D12 ? alterStress(character._id, stress, +1) : null;
                                })}
                            >
                                <i className="far fa-plus"/>
                            </button>
                        </div>
                    </div>
                })}
            </fieldset>
        </div>
    </div>;
})

export const CharacterSheet = connect(
    ({currentCharacter, rolls}) => ({character: currentCharacter, rolls}),
    {setDice}
)(({character, rolls, setDice}) => {
    if (!character) {
        return null;
    }

    const dicePool = rolls.get(character._id)?.dice_pool || {};

    const attributes = character.attributes
        ? <fieldset>
            <legend>Attributes</legend>
            <div className="grid-x grid-margin-x">
                {Object.entries(character.attributes).map(([attribute, {die}]) => {
                        const label = titleCase(attribute);
                        const selected = dicePool.attribute && dicePool.attribute.label === label;
                        return <div className={`cell small-4 clickable ${selected ? 'selected' : ''}`}
                                    key={attribute}
                                    onClick={preventDefault(() => setDice(
                                        character._id,
                                        'attribute',
                                        label,
                                        selected ? null : [parseInt(die)],
                                        1
                                    ))}
                        >
                            <div className="grid-x grid-margin-x align-middle">
                                <div className='cell auto'>
                                    <h4>{label}</h4>
                                </div>
                                <div className="cell shrink">
                                    <Die sides={parseInt(die)} displaySize={DisplaySize.SMALL}/>
                                </div>
                            </div>
                        </div>;
                    }
                )}
            </div>
        </fieldset>
        : null;

    const narrator_trait_array = [
        ...character.catalyst_die ? [['catalyst', 'Catalyst', character.catalyst_die, 2]] : [],
        ...(character.misc || []).map(({label, die}) => [
            'misc_' + label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '_'),
            label,
            die,
            3
        ])
    ];

    const narrator_traits = narrator_trait_array.length > 0
        ? <fieldset>
            <legend>Narrator Traits</legend>
            {narrator_trait_array.map(([key, trait, die, order]) => {
                    const selected = dicePool[key] != null;
                    return <div
                        className={`grid-x grid-margin-x align-middle clickable ${selected ? 'selected' : ''}`}
                        onClick={preventDefault(() => setDice(
                            character._id,
                            key,
                            trait,
                            selected ? null : [parseInt(die)],
                            order
                        ))}
                        key={key}>
                        <div className='cell auto'>
                            <h4>{trait}</h4>
                        </div>
                        <div className="cell shrink">
                            <Die sides={parseInt(die)} displaySize={DisplaySize.SMALL}/>
                        </div>
                    </div>;
                }
            )}

        </fieldset>
        : null;

    const valuesOrder = ['devotion', 'liberty', 'glory', 'mastery', 'justice', 'truth']

    const values = character.values
        ? <fieldset>
            <legend>Values</legend>
            <div className="grid-x grid-margin-x">
                {valuesOrder.map((value) => {
                        const {die, description} = character.values[value];
                        const label = titleCase(value);
                        const selected = dicePool.value && dicePool.value.label === label;

                        return <div className={`cell small-6 clickable ${selected ? 'selected' : ''}`}
                                    key={value}
                                    onClick={preventDefault(() => setDice(
                                        character._id,
                                        'value',
                                        label,
                                        selected ? null : [parseInt(die)],
                                        4
                                    ))}>
                            <div className="grid-x grid-margin-x align-middle">
                                <div className='cell auto'>
                                    <h4>{label}</h4>
                                </div>
                                <div className="cell shrink">
                                    <Die sides={parseInt(die)} displaySize={DisplaySize.SMALL}/>
                                </div>
                                {description
                                    ? <div className="cell large-12">
                                        <span className='trait-statement'>
                                            {description}
                                        </span>
                                    </div>
                                    : null
                                }
                            </div>
                        </div>;
                    }
                )}
            </div>
        </fieldset>
        : null;

    function renderSFX(sfx) {
        const parts = sfx.split(/\[(D4|D6|D8|D10|D12|PP)]/)
                         .flatMap((str, index) => {
                             if (!str) {
                                 return [];
                             }

                             const match = str.match(/^D(\d)$/);
                             if (match) {
                                 return [<Die displaySize={DisplaySize.SMALL}
                                              sides={parseInt(match[1])}
                                              key={index}/>]
                             }
                             if (str === 'PP') {
                                 return [<Die displaySize={DisplaySize.SMALL}
                                              sides={Dice.PP}
                                              key={index}/>]
                             }
                             return [<span key={index}>{str}</span>];
                         });

        return <span>{parts}</span>
    }

    const hinder = {
        label:       'Hinder',
        selected:    label => dicePool.distinction && dicePool.distinction.label === `${label} (Hindered)`,
        onClick:     label => {
            return setDice(
                character._id,
                'distinction',
                `${label} (Hindered)`,
                dicePool.distinction && dicePool.distinction.label === `${label} (Hindered)` ? null : [Dice.D4],
                5
            );
        },
        description: 'Gain one [PP] when you switch out this distinction’s die rating for a [D4]'
    }

    const distinctions = character.distinctions
        ? <fieldset>
            <legend>Distinctions</legend>
            <div>
                {Object.entries(character.distinctions).map(([distinction, {label, sfx = []}]) => {
                        const selected = dicePool.distinction?.label === label;

                        return <div key={distinction}>
                            <div className={`clickable ${selected ? 'selected' : ''}`}
                                 onClick={preventDefault(() => {
                                     console.log('hi');
                                     return setDice(
                                         character._id,
                                         'distinction',
                                         label,
                                         selected ? null : [Dice.D8],
                                         5
                                     );
                                 })}
                            >
                                <div className="grid-x grid-margin-x align-middle">
                                    <div className='cell auto'>
                                        <h4>{label}</h4>
                                    </div>
                                    <div className="cell shrink">
                                        <Die sides={Dice.D8} displaySize={DisplaySize.SMALL}/>
                                    </div>
                                </div>
                            </div>
                            <ul>
                                {[hinder, ...sfx].map(
                                    ({
                                         label: sfxLabel,
                                         description,
                                         onClick,
                                         selected
                                     }, index
                                    ) =>
                                        <li key={index}
                                            {...(typeof onClick === 'function'
                                                ? {
                                                    onClick:   preventDefault(() => onClick(label)),
                                                    className: `clickable ${selected(label) ? 'selected' : ''}`
                                                }
                                                : {})}
                                        >
                                            <em>{sfxLabel}</em>: {renderSFX(description)}
                                        </li>
                                )}
                            </ul>
                        </div>;
                    }
                )}
            </div>
        </fieldset>
        : null;

    const specialities = character.specialities
        ? <fieldset>
            <legend>Specialities</legend>
            {character.specialities.map(({label, die, description}, index) =>
                {
                    const selected = dicePool.speciality && dicePool.speciality.label === label;
                    return <div key={index}
                                className={`clickable ${selected ? 'selected' : ''}`}
                                onClick={preventDefault(() => setDice(
                                    character._id,
                                    'speciality',
                                    label,
                                    selected ? null : [parseInt(die)],
                                    7
                                ))}>
                        <div className="grid-x grid-margin-x align-middle">
                            <div className='cell auto'>
                                <h4>{label}</h4>
                            </div>
                            <div className="cell shrink">
                                <Die sides={parseInt(die)} displaySize={DisplaySize.SMALL}/>
                            </div>
                            {description
                                ? <div className="cell large-12">
                                    <span className='trait-statement'>
                                        {description}
                                    </span>
                                </div>
                                : null
                            }
                        </div>
                    </div>;
                }
            )}
        </fieldset>
        : null

    const assetSelected = dicePool && dicePool.signature_asset;

    const signature_asset = character.signature_asset
        ? <div className={`cell small-${distinctions && specialities ? '6' : '12'}`}>
            <fieldset>
                <legend>Signature Asset</legend>
                <div className={`grid-x clickable ${assetSelected ? 'selected' : ''}`}
                onClick={preventDefault(() => setDice(
                    character._id,
                    'signature_asset',
                    character.signature_asset.label,
                    assetSelected ? null : [parseInt(character.signature_asset.die)],
                    8
                ))}
                >
                    <div className='cell auto'>
                        <h4>{character.signature_asset.label}</h4>
                    </div>
                    <div className="cell shrink">
                        <Die sides={parseInt(character.signature_asset.die)}
                             displaySize={DisplaySize.SMALL}/>
                    </div>
                    {character.signature_asset.description
                        ? <div className="cell large-12"
                               dangerouslySetInnerHTML={{
                                   __html: renderMarkdown(character.signature_asset.description)
                               }}/>
                        : null
                    }
                </div>
            </fieldset>
        </div>
        : null;

    return <div className="character-sheet"
                style={{...(character.image_url ? {'--bg-image': `url(${character.image_url})`} : {})}}>
        {attributes}
        {narrator_traits}
        {values}
        {distinctions}
        <div className="grid-x grid-margin-x">
            <div className={`cell small-${signature_asset ? '5' : '12'}`}>
                {specialities}
            </div>
            <div className={`cell small-${specialities ? '7' : '12'}`}>
                {signature_asset}
            </div>
        </div>
    </div>;
})

export const Description = connect(
    ({currentCharacter}) => ({character: currentCharacter}),
    {}
)(({character}) =>
    character && character.description
        ? <fieldset>
            <legend>Description</legend>
            <div className="description-small"
                 dangerouslySetInnerHTML={{__html: renderMarkdown(character.description)}}
            />
        </fieldset>
        : null
);
