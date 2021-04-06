import React from "react";
import {connect} from "react-redux";
import {preventDefault} from './util.jsx';

export const Mode = {
    UNROLLED: 'unrolled',
    SELECTED: 'selected',
    EFFECT:   'effect',
    IGNORED:  'ignored',
    HITCH:    'hitch',
    PP:       'plot-point',
}

export const Dice = {
    D4:  4,
    D6:  6,
    D8:  8,
    D10: 10,
    D12: 12,
    PP: 'PP'
}

export const DisplaySize = {
    SMALL:  'small',
    MEDIUM: 'medium',
    LARGE:  'large',
}

// noinspection JSIncompatibleTypesComparison
export function Die({
                        displaySize = DisplaySize.MEDIUM,
                        sides = Dice.D4,
                        mode = sides === Dice.PP ? Mode.PP : Mode.UNROLLED,
                        value = sides,
                        onClick = () => {}
                    }) {
    const data = getDieData(sides);

    if (!data) {
        console.error(sides, ' Not a valid die');
        return null;
    }

    const label = getLabel(mode, sides, value);
    const textProps = {
        textAnchor:    "middle",
        fontSize:      "15px",
        fontWeight:    "bold",
        'aria-hidden': "true",
        ...data.text
    }
    const clipPath = data.clipPath || {};

    // noinspection JSIncompatibleTypesComparison
    if(sides === Dice.PP && value !== Dice.PP)
    {
        data.paths = [data.paths[0]];
        data.noText = false;
    }

    return <svg className={`die ${mode} ${displaySize}`}
                viewBox={data.viewBox}
                role="img"
                aria-label={label}
                xmlns="http://www.w3.org/2000/svg"
                onClick={preventDefault(onClick)}
    >
        <g {...{clipPath: clipPath.id}}>
            {data.paths.map((path, index) => <path d={path} key={index}/>)}
            {data.noText ? null : <text {...textProps}>{value}</text>}
        </g>
        <defs>
            {clipPath.html}
        </defs>
    </svg>
}

function getDieData(sides) {
    switch (sides) {
        case Dice.D4:
            return {
                viewBox:  '0 0 30 26',
                paths:    ['M14.6814 25.5209L29.5 0H0L14.6814 25.5209Z'],
                text:     {x: 14, y: 15},
                clipPath: {
                    id:   'd4-clip0',
                    html: <clipPath id="d4-clip0">
                              <rect width="29.5" height="25.5209" fill="white"/>
                          </clipPath>
                },
            }
        case Dice.D6:
            return {
                viewBox: '0 0 23 23',
                paths:   ['M23 2H2V21H21V0Z'],
                text:    {x: 11, y: 16, fontSize: '12px'},
            }
        case Dice.D8:
            return {
                viewBox: '0 0 56 57',
                paths:   ['M27.8735 2.00001L1.52148 28.3521L27.8735 54.7041L54.2256 28.3521L27.8735 2.00001Z'],
                text:    {
                    x:        27,
                    y:        38,
                    fontSize: '28px',
                }
            }
        case Dice.D10:
            return {
                viewBox: '0 0 26 28',
                paths:   ['M13 0L0 9.41935V18.5806L13 28L26 18.5806V9.41935L13 0Z'],
                text:    {x: 12.3, y: 20},
            }
        case Dice.D12:
            return {
                viewBox: '0 0 26 27',
                paths:   ['M4.94 2.57143L0 9.38571V17.7429L4.94 24.4286L13 27L21.06 24.4286L26 17.7429V9.38571L21.06 2.57143L13 0L4.94 2.57143Z'],
                text:    {x: 12.4, y: 19},
            }
        case Dice.PP:
            return {
                viewBox:  '0 0 26 26',
                paths:    [
                    'M13.0282 26.0564C20.2235 26.0564 26.0564 20.2235 26.0564 13.0282C26.0564 5.83292 20.2235 0 13.0282 0C5.83292 0 0 5.83292 0 13.0282C0 20.2235 5.83292 26.0564 13.0282 26.0564Z',
                    'M5.86548 8.1775C5.86548 8.00831 5.97828 7.89551 6.14747 7.89551H9.58782C11.3926 7.89551 12.859 9.36189 12.859 11.1103C12.859 12.915 11.3926 14.3814 9.58782 14.3814H7.78305V17.8218C7.78305 17.991 7.67025 18.1038 7.50105 18.1038H6.14747C5.97828 18.1038 5.86548 17.991 5.86548 17.8218V8.1775ZM9.47502 12.633C10.321 12.633 10.9978 11.9562 10.9978 11.1103C10.9978 10.3207 10.321 9.70028 9.47502 9.70028H7.78305V12.633H9.47502Z',
                    'M14.551 8.1775C14.551 8.00831 14.6638 7.89551 14.833 7.89551H18.2734C20.0781 7.89551 21.5445 9.36189 21.5445 11.1103C21.5445 12.915 20.0781 14.3814 18.2734 14.3814H16.4686V17.8218C16.4686 17.991 16.3558 18.1038 16.1866 18.1038H14.833C14.6638 18.1038 14.551 17.991 14.551 17.8218V8.1775ZM18.1606 12.633C19.0066 12.633 19.6833 11.9562 19.6833 11.1103C19.6833 10.3207 19.0066 9.70028 18.1606 9.70028H16.4686V12.633H18.1606Z',
                ],
                clipPath: {
                    id:   'plot-point-clip0',
                    html: <clipPath id="plot-point-clip0">
                              <rect width="26" height="26" fill="white"/>
                          </clipPath>
                },
                text:    {x: 12.9, y: 18.3},
                noText: true,
            }
    }
}

export const DiceBlock = connect(({}) => ({}), {})(({}) =>
    <fieldset>
        <legend>Additional Dice</legend>
        <div className="grid-x grid-margin-x small-up-5">
        <div className="cell"><Die sides={Dice.D4} displaySize={DisplaySize.MEDIUM} /></div>
        <div className="cell"><Die sides={Dice.D6} displaySize={DisplaySize.MEDIUM} /></div>
        <div className="cell"><Die sides={Dice.D8} displaySize={DisplaySize.MEDIUM} /></div>
        <div className="cell"><Die sides={Dice.D10} displaySize={DisplaySize.MEDIUM} /></div>
        <div className="cell"><Die sides={Dice.D12} displaySize={DisplaySize.MEDIUM} /></div>
    </div>
    </fieldset>
)

function getLabel(mode, sides, value) {
    switch (mode) {
        case Mode.UNROLLED:
            return `A d${sides}`
        case Mode.SELECTED:
            return `A selected d${sides} with value ${value}`
        case Mode.EFFECT:
            return `A d${sides} effect die`
        case Mode.HITCH:
            return `A d${sides} Hitch`
        case Mode.PP:
            return `A Plot Point`
        default:
            return `A d${sides} with value ${value}`;
    }
}

