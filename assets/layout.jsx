import React from "react";
import {Roller, Rolls} from './roll';
import {SceneChange} from './sceneChange';
import {ShowSnippet} from './snippet';

export const Layout = () =>
    <div className="grid-container full">
        <div className="grid-x grid-margin-x grid-margin-y">
            <div className="cell show-for-large large-5">
                <ShowSnippet />
            </div>
            <div className="cell small-12 medium-7 large-4">
                <h2>Scene Change</h2>
                <SceneChange />
                <br />
                <Roller/>
            </div>
            <div className="cell small-12 medium-5 large-3">
                <Rolls/>
            </div>
        </div>
    </div>
