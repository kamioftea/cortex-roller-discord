import React from "react";
import {Rolls} from './roll';
import {SceneChange} from './sceneChange';
import {ShowSnippet} from './snippet';
import {CharacterSelect, CharacterSheet, Description, Trackers} from './character';
import {DiceBlock} from './roll';

export const Layout = () =>
    <div className="grid-container full wrapper-container">
        <div className="grid-x grid-padding-x grid-padding-y wrapper-container">
            <div className="cell small-12 medium-6 large-3 wrapper-container">
                <div className="grid-y grid-padding-y wrapper-container">
                    <div className="cell">
                        <CharacterSelect/>
                        <Trackers/>
                        <DiceBlock/>
                        <Description/>
                    </div>
                    <div className="cell sticky" style={{bottom: '0'}}>
                        <SceneChange/>
                    </div>
                </div>
            </div>
            <div className="cell small-12 medium-6 large-4 full-height">
                <CharacterSheet/>
            </div>
            <div className="cell small-12 large-5 snippet-container">
                <Rolls/>
                <ShowSnippet/>
            </div>
        </div>
    </div>
