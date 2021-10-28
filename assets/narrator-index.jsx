import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import {buildStore} from "./store";
import {Layout} from "./narrator";
import {setCampaign} from './campaign';

const mount = document.getElementById('react-mount-point');
const {websocketUrl, campaign} = mount.dataset;
const store = buildStore(websocketUrl);
store.dispatch(setCampaign(JSON.parse(campaign)));

ReactDOM.render(
    <Provider store={store}>
        <Layout/>
    </Provider>,
    mount
);
