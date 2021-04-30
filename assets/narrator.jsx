import React from "react";
import {connect} from 'react-redux';
import titleCase from '../helpers/titleCase'
import {Dice, Die, DisplaySize} from './dice';

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
            </div>
            <div className="cell small-12 large-5 snippet-container">
            </div>
        </div>
    </div>

const Characters = connect(
    ({characters, assets}) => ({characters, assets}),
    {}
)(({characters, assets}) => {
        return <div>
            {characters
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(character => {
                        const renderedAssets = [...assets.values()]
                            .filter(asset => (asset.characterIds || []).includes(character._id))
                            .map(asset =>
                                <div className="cell small-6" key={asset._id}>
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
                                      <div className="cell small-4" key={character._id}>
                                          <div className="grid-x grid-padding-x">
                                              <div className="cell auto">{titleCase(label)}</div>
                                              <div className="cell shrink">
                                                  <Die sides={die} displaySize={DisplaySize.SMALL}/>
                                              </div>
                                          </div>
                                      </div>
                                  );
                        return <div className="card">
                            <div className="card-divider">
                                <div className="grid-x grid-margin-x">
                                    <div className="cell auto">
                                        <h3>
                                            {character.icon_url
                                                ? <img src={character.icon_url} style={{height: '2.5rem'}}
                                                       alt={character.name + ' Icon'}/>
                                                : null
                                            } {' '}
                                            {character.name}
                                        </h3>
                                    </div>
                                    <div className="cell shrink text-right">
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
