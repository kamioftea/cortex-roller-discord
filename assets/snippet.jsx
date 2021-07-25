import React from "react";
import {connect} from "react-redux";
import {Map, Record} from 'immutable';
import {renderMarkdown} from './util';

export const SET_ACTIVE_SNIPPET = Symbol('set-active-snippet')
const SET_SNIPPET = Symbol('set-snippet')
export const REMOVE_SNIPPET = Symbol('remove-snippet')
export const UPDATE_SNIPPET = Symbol('update-snippet')
export const UPDATE_ACTIVE_SNIPPET = Symbol('active-snippet')

const Snippet = Record({
    _id:            '',
    title:          '',
    image_url:      null,
    description:    null,
    notes:          null,
    image_position: null,
    image_width:    null,
    text_style:     null,
    active:         false,
})

export const setActiveSnippet = ({snippet}) => ({
    type:    SET_ACTIVE_SNIPPET,
    snippet: snippet && Snippet(snippet),
})

export const setSnippet = ({snippet}) => ({
    type:    SET_SNIPPET,
    snippet: Snippet(snippet),
})

export const removeSnippet = ({snippet_id}) => ({
    type: REMOVE_SNIPPET,
    snippet_id,
})

export const updateSnippet = snippet => ({type: UPDATE_SNIPPET, snippet});
export const updateActiveSnippet = snippet_id => ({type: UPDATE_ACTIVE_SNIPPET, snippet_id})

export function activeSnippetReducer(state = null, action) {
    switch (action.type) {
        case SET_ACTIVE_SNIPPET:
            return action.snippet || null;

        default:
            return state;
    }
}

export function snippetsReducer(state = Map(), action) {
    switch (action.type) {
        case SET_SNIPPET:
            return state.set(action.snippet._id, action.snippet);

        case REMOVE_SNIPPET:
            return state.delete(action.snippet_id);

        case SET_ACTIVE_SNIPPET:
            return action.snippet !== null
                ? state.set(action.snippet._id, action.snippet)
                : state.map(snippet => snippet.set('active', false));

        default:
            return state;
    }
}

export const ShowSnippet = connect(({snippet}) => ({snippet}), {})
(({snippet, snippetOverride}) => {
    snippet = snippetOverride || snippet;

    if (!snippet) {
        return null;
    }

    return <div className='fade-in margin-top-1' key={snippet.title}>
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
