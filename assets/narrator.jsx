import React, {useState} from "react";
import {connect} from 'react-redux';
import titleCase from '../helpers/titleCase'
import {Dice, Die, DisplaySize} from './dice';
import {
    REMOVE_SNIPPET,
    SET_ACTIVE_SNIPPET,
    ShowSnippet,
    updateActiveSnippet,
    updateSnippet
} from './snippet';
import {Dropdown, preventDefault, renderMarkdown} from './util';

const SET_NARRATOR_SNIPPET = Symbol('set-narrator-snippet');

const setNarratorSnippet = (snippet_id) => ({type: SET_NARRATOR_SNIPPET, snippet_id});

export function narratorSnippetReducer(state = null, action) {
    switch (action.type) {
        case SET_NARRATOR_SNIPPET:
            return action.snippet_id;

        case SET_ACTIVE_SNIPPET:
            return action.snippet ? action.snippet._id : state;

        case REMOVE_SNIPPET:
            return action.snippet_id === state ? null : state;

        default:
            return state;
    }
}

export const Layout = () =>
    <div className="grid-container full wrapper-container">
        <div className="grid-x grid-padding-x grid-padding-y wrapper-container">
            <div className="cell small-12 medium-6 large-3 wrapper-container">
                <div className="grid-y grid-padding-y wrapper-container">
                    <div className="cell">
                        <Characters/>
                    </div>
                </div>
            </div>
            <div className="cell small-12 medium-6 large-4">
                <SnippetsSwitcher/>
                <Notes/>
            </div>
            <div className="cell small-12 large-5 snippet-container">
                <NarratorSnippet/>
            </div>
        </div>
    </div>

const Characters = connect(
    ({characters, assets, campaign}) => ({characters, assets, campaign}),
    {}
)(({characters, assets, campaign}) => {
        return <div>
            <pre>{JSON.stringify(campaign.toJS(), null, " ")}</pre>
            {characters
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(character => {
                        const renderedAssets = [...assets.values()]
                            .filter(asset => (asset.characterIds || []).includes(character._id))
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map(asset =>
                                <div className="cell small-6" key={`${asset._id}`}>
                                    <div className="grid-x grid-padding-x">
                                        <div className="cell auto">{asset.label}</div>
                                        <div className="cell shrink">
                                            <Die sides={parseInt(asset.die)}
                                                 displaySize={DisplaySize.SMALL}/>
                                        </div>
                                    </div>
                                </div>
                            );
                        const renderedStress =
                            Object.entries(character.stress || {})
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([label, die]) =>
                                      <div className="cell small-4" key={label}>
                                          <div className="grid-x grid-padding-x">
                                              <div className="cell auto">{titleCase(label)}</div>
                                              <div className="cell shrink">
                                                  <Die sides={die} displaySize={DisplaySize.SMALL}/>
                                              </div>
                                          </div>
                                      </div>
                                  );
                        return <div className="card" key={character._id}>
                            <div className="card-divider">
                                <div className="grid-x grid-margin-x">
                                    <div className="cell auto">
                                        <h3>
                                            {character.icon_url
                                                ?
                                                <img src={character.icon_url} style={{height: '2.5rem'}}
                                                     alt={character.name + ' Icon'}/>
                                                : null
                                            } {' '}
                                            {character.name}
                                        </h3>
                                    </div>
                                    <div className="cell shrink text-right">
                                        <a className={`button small primary`}
                                           target="_blank"
                                           href={`/${campaign.slug}/character/edit/${character._id}`}
                                        >
                                            <span className="far fa-external-link"/>{' '}
                                            Edit
                                        </a>
                                        <Die value={character.plot_points}
                                             sides={Dice.PP}
                                             displaySize={DisplaySize.MEDIUM}
                                        />
                                    </div>
                                </div>
                            </div>
                            {renderedStress.length > 0
                                ? <div className="card-section">
                                    <div className="grid-x grid-padding-x">
                                        {renderedStress}
                                    </div>
                                </div>
                                : null
                            }
                            {renderedAssets.length > 0
                                ? <div className="card-section">
                                    <div className="grid-x grid-padding-x">
                                        {renderedAssets}
                                    </div>
                                </div>
                                : null
                            }
                        </div>;
                    }
                )
            }
        </div>
    }
)

const SnippetsSwitcher = connect(
    ({snippets, snippet: activeSnippet, narratorSnippet}) => ({
        snippets,
        activeSnippet,
        narratorSnippet
    }),
    {updateActiveSnippet}
)(({snippets, activeSnippet, narratorSnippet, updateActiveSnippet}) => {
    const snippet =
        narratorSnippet && snippets.has(narratorSnippet)
            ? snippets.get(narratorSnippet)
            : null;

    const renderActive = activeSnippet
        ? <h3>
            {activeSnippet.image_url
                ? <img src={activeSnippet.image_url} style={{height: '2.5rem'}}
                       alt={activeSnippet.title + ' icon'}/>
                : null
            }{' '}
            {activeSnippet.title}
        </h3>
        : <h3>No Active Snippet</h3>

    return <div>
        <div className="grid-x">
            <div className="cell auto">
                {renderActive}
            </div>
            <div className="cell shrink">
                {snippet && (!activeSnippet || snippet._id !== activeSnippet._id)
                    ? <button className={`button small primary`}
                              onClick={preventDefault(() => updateActiveSnippet(snippet._id))}
                    >
                        Switch to {snippet.title}
                    </button>
                    : null
                }
            </div>
            <div className="cell shrink">
                <button className={`button small alert ${activeSnippet ? '' : 'disabled'}`}
                        onClick={preventDefault(() => updateActiveSnippet(null))}
                >
                    Clear Active
                </button>
            </div>
        </div>
        <div className="grid-x">
            <div className="cell auto">
                <SnippetSelect/>
            </div>
            <div className="cell shrink">
                {snippet
                    ? <a className={`button small primary`}
                             target="_blank"
                         href={`/snippet/edit/${snippet._id}`}
                    >
                        <span className="far fa-external-link"/>{' '}
                        Edit
                    </a>
                    : null
                }
            </div>
        </div>
    </div>
});

const Notes = connect(
    ({snippets, narratorSnippet}) => ({snippets, narratorSnippet}),
    {updateSnippet}
)(({snippets, narratorSnippet, updateSnippet}) => {
    if (!narratorSnippet || !snippets.has(narratorSnippet)) {
        return null;
    }

    const snippet = snippets.get(narratorSnippet)

    const [isEditing, setEditing] = useState(false);
    const [updatedNotes, setUpdatedNotes] = useState(null);

    return <div key={snippet._id}>
        <div className="grid-x">
            <div className="cell auto">
                <h2>Narrator Notes</h2>
            </div>
            <div className="cell shrink">
                {isEditing
                    ? <div className="button-group">
                        <button className="button success small"
                                onClick={preventDefault(() => {
                                        updateSnippet(snippet.set('notes', updatedNotes));
                                        setUpdatedNotes(null);
                                        setEditing(false);
                                    }
                                )}>
                            <span className="far fa-check"/>{' '}
                            Save
                        </button>
                        <button className="button alert small"
                                onClick={preventDefault(() => {
                                        setUpdatedNotes(null);
                                        setEditing(false);
                                    }
                                )}>
                            <span className="far fa-times"/>{' '}
                            Cancel
                        </button>
                    </div>
                    : <button className="button primary small"
                              onClick={preventDefault(() => {
                                      setUpdatedNotes(snippet.notes);
                                      setEditing(true);
                                  }
                              )}>
                        <span className="far fa-pencil"/>{' '}
                        Edit
                    </button>
                }
            </div>
        </div>
        {isEditing
            ? <textarea style={{height: '80vh'}}
                        onChange={preventDefault(e => setUpdatedNotes(e.target.value))}
                        value={updatedNotes}/>
            : <div className={'description-small'}
                   dangerouslySetInnerHTML={{
                       __html: renderMarkdown(snippet.notes || '')
                   }}
            />
        }
    </div>
});

const NarratorSnippet = connect(
    ({snippets, narratorSnippet}) => ({snippets, narratorSnippet}),
    {}
)(({snippets, narratorSnippet}) => {
    if (!narratorSnippet || !snippets.has(narratorSnippet)) {
        return null;
    }

    const snippet = snippets.get(narratorSnippet)

    return <ShowSnippet snippetOverride={snippet}/>
})

export const SnippetSelect = connect(
    ({snippets, narratorSnippet}) => ({snippets, narratorSnippet}),
    ({setNarratorSnippet})
)(({snippets, narratorSnippet, setNarratorSnippet}) => {
    if (snippets.size === 0) {
        return <div>
            <h2>No Snippets Available</h2>
        </div>
    }

    const snippetOptions =
        Object.fromEntries(
            snippets
                .toArray()
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(snippet =>
                    [
                        snippet.title,
                        <div onClick={() => setNarratorSnippet(snippet._id)}
                             style={{cursor: 'pointer'}}>
                            <h4>
                                {snippet.image_url
                                    ? <img src={snippet.image_url}
                                           style={{height: '1.5rem', width: '1.5rem'}}
                                           alt={snippet.title + ' icon'}/>
                                    : null
                                }{' '}
                                {snippet.title}
                            </h4>
                        </div>
                    ]
                )
        );

    const snippet = snippets.get(narratorSnippet)

    return <div>
        <Dropdown options={snippetOptions}>
            {snippet
                ? <h3>
                    {snippet.image_url
                        ? <img src={snippet.image_url} style={{height: '2.5rem'}}
                               alt={snippet.title + ' icon'}/>
                        : null
                    }{' '}
                    {snippet.title}
                </h3>
                : <h2>Choose a snippet...</h2>
            }
        </Dropdown>
    </div>
})
