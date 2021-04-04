import React from "react";
import {preventDefault} from './util.jsx';

export const Mode = {
    UNROLLED: 'unrolled',
    SELECTED: 'selected',
    EFFECT:   'effect',
    IGNORED:  'ignored',
    HITCH:    'hitch',
}

export const Dice = {
    D4:  4,
    D6:  6,
    D8:  8,
    D10: 10,
    D12: 12,
}

export const DisplaySize = {
    SMALL:  'small',
    MEDIUM: 'medium',
    LARGE:  'large',
}

export function Die({
                        displaySize = DisplaySize.MEDIUM,
                        mode = Mode.UNROLLED,
                        sides = Dice.D4,
                        value = sides,
                        onClick = () => {
                        }
                    }) {
    const data = getDieData(sides);
    const label = getLabel(mode, sides, value);
    const textProps = {
        textAnchor:    "middle",
        fontSize:      "15px",
        fontWeight:    "bold",
        'aria-hidden': "true",
        ...data.text
    }
    const clipPath = data.clipPath || {};

    return <svg className={`die ${mode} ${displaySize}`}
                viewBox={data.viewBox}
                role="img"
                aria-label={label}
                xmlns="http://www.w3.org/2000/svg"
                onClick={preventDefault(onClick)}
    >
        <g {...{clipPath: clipPath.id}}>
            <path d={data.path}/>
            <text {...textProps}>{value}</text>
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
                path:     'M14.6814 25.5209L29.5 0H0L14.6814 25.5209Z',
                text:     {x: 14, y: 15},
                clipPath: {
                    id:   'd4-clip0',
                    html: <clipPath id="d4-clip0">
                              <rect width="29.5" height="25.5209" fill="white"/>
                          </clipPath>
                }
            }
        case Dice.D6:
            return {
                viewBox: '0 0 23 23',
                path:    'M23 0H0V23H23V0Z',
                text:    {x: 11, y: 17}
            }
        case Dice.D8:
            return {
                viewBox: '0 0 56 57',
                path:    'M27.8735 2.00001L1.52148 28.3521L27.8735 54.7041L54.2256 28.3521L27.8735 2.00001Z',
                text:    {
                    x:        27,
                    y:        38,
                    fontSize: '28px',
                }
            }
        case Dice.D10:
            return {
                viewBox: '0 0 26 28',
                path:    'M13 0L0 9.41935V18.5806L13 28L26 18.5806V9.41935L13 0Z',
                text:    {x: 12.3, y: 20}
            }
        case Dice.D12:
            return {
                viewBox: '0 0 26 27',
                path:    'M4.94 2.57143L0 9.38571V17.7429L4.94 24.4286L13 27L21.06 24.4286L26 17.7429V9.38571L21.06 2.57143L13 0L4.94 2.57143Z',
                text:    {x: 12.4, y: 19}
            }
    }
}

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
        default:
            return `A d${sides} with value ${value}`;
    }
}

