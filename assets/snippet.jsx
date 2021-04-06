import React from "react";
import {connect} from "react-redux";
import {Record} from 'immutable';
import {renderMarkdown} from './util';

const SET_SNIPPET = Symbol('set-snippet')

const Snippet = Record({
    title:          '',
    image_url:      null,
    description:    null,
    image_position: null,
    image_width:    null,
    text_style:     null,
})

export const setSnippet = ({snippet}) => ({
    type:    SET_SNIPPET,
    snippet: snippet && Snippet(snippet),
})

export function snippetReducer(state = null, action) {
    switch (action.type) {
        case SET_SNIPPET:
            return action.snippet || null;

        default:
            return state;
    }
}

export const ShowSnippet = connect(({snippet}) => ({snippet}), {})
(({snippet}) => {
    if (!snippet) {
        return null;
    }

    return <div className='fade-in' key={snippet.title}>
        {snippet.image_url
            ? <img src={snippet.image_url}
                   style={{width: snippet.image_width || '100%'}}
                   className={snippet.image_position}
                   alt={snippet.title + ' image'}/>
            : null
        }
        <h2>{snippet.title}</h2>
        {snippet.description
            ? <div className={snippet.text_style || 'description-medium'}
                   dangerouslySetInnerHTML={{
                       __html: renderMarkdown(snippet.description)
                   }}/>
            : null
        }
    </div>
});
