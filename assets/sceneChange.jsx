import React from "react";
import {connect} from "react-redux";

import {preventDefault} from './util';

export const TRIGGER_SCENE_CHANGE = Symbol('scene-change-triggered')

const triggerSceneChange = (action) => ({type: TRIGGER_SCENE_CHANGE, action});

const SceneChangeButton = connect(({}) => ({}), {triggerSceneChange})
(({action, icon, triggerSceneChange}) =>
    <button className="button primary expanded" onClick={preventDefault(() => triggerSceneChange(action))}>
        {icon ? <i className={icon} /> : null}{' '}
        {action}
    </button>
);

export const SceneChange = () =>
    <div className="grid-x grid-margin-x grid-margin-y align-stretch">
        <div className="cell small-4 ">
            <SceneChangeButton action='Rewind' icon='far fa-backward'/>
        </div>
        <div className="cell small-4 ">
            <SceneChangeButton action='Replay' icon='far fa-sync'/>
        </div>
        <div className="cell small-4 ">
            <SceneChangeButton action='Pause' icon='far fa-pause'/>
        </div>
        <div className="cell small-4 ">
            <SceneChangeButton action='Resume' icon='far fa-play'/>
        </div>
        <div className="cell small-4 ">
            <SceneChangeButton action='Step' icon='far fa-step-forward'/>
        </div>
        <div className="cell small-4 ">
            <SceneChangeButton action='Forward' icon='far fa-forward'/>
        </div>
    </div>
