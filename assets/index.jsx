import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import {buildStore} from "./store";
import {Layout} from "./layout";

const mount = document.getElementById('react-mount-point');
const {websocketUrl} = mount.dataset;
const store = buildStore(websocketUrl);


ReactDOM.render(
    <Provider store={store}>
        <Layout/>
    </Provider>,
    mount
);
