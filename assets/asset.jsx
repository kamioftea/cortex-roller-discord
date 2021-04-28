import React from "react";
import {connect} from "react-redux";
import {Map, Record} from 'immutable';
import {setDice} from './roll'
import {preventDefault} from './util';
import {Die, DisplaySize} from './dice';

const Asset = Record({
    _id:          '',
    label:         '',
    die:          0,
    characterIds: [],
})

const SET_ASSET = Symbol('set-asset');
const REMOVE_ASSET = Symbol('remove-asset');

export const setAsset = ({asset}) => ({
    type:  SET_ASSET,
    asset: Asset(asset),
})

export const removeAsset = ({_id}) => ({type: REMOVE_ASSET, _id});

export function assetReducer(state = new Map(), action) {
    switch (action.type) {
        case SET_ASSET:
            return state.set(action.asset._id, action.asset)

        case REMOVE_ASSET:
            return state.delete(action._id)

        default:
            return state;
    }
}

export const CharacterAssets = connect(
    ({currentCharacter, assets, rolls}) => ({currentCharacter, assets, rolls}),
    {setDice}
)(({currentCharacter, assets, rolls, setDice}) => {
    if (currentCharacter === null) {
        return null;
    }

    const characterAssets =
        [...assets.values()]
            .filter(({characterIds}) => characterIds.includes(currentCharacter._id))
            .sort(({label: a}, {label: b}) => a.localeCompare(b))

    if (characterAssets.length === 0) {
        return null;
    }

    const dicePool = rolls.get(currentCharacter._id)?.dice_pool || {};

    return <fieldset>
        <legend>Temporary Assets</legend>
        {characterAssets.map(asset => {
                const dieKey = 'asset-' + asset._id;
                const selected = dicePool[dieKey];
                console.log(asset.toJS())

                return <div key={asset._id}
                            className={`clickable ${selected ? 'selected' : ''}`}
                            onClick={preventDefault(() => setDice(
                                currentCharacter._id,
                                dieKey,
                                asset.label,
                                selected ? null : [parseInt(asset.die)],
                                9
                            ))}>
                    <div className="grid-x grid-margin-x align-middle">
                        <div className='cell auto'>
                            <h4>{asset.label}</h4>
                        </div>
                        <div className="cell shrink">
                            <Die sides={parseInt(asset.die)} displaySize={DisplaySize.SMALL}/>
                        </div>
                    </div>
                </div>
            }
        )}
    </fieldset>
})
