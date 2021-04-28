import React from "react";
import {Parser, HtmlRenderer} from 'commonmark'

const parser = new Parser({smart: true});
const renderer = new HtmlRenderer({});

export const preventDefault = fn => (e => {
    e.preventDefault();
    fn(e)
});

export const Position = {
    LEFT:  'left',
    RIGHT: 'right',
}

export class Dropdown extends React.PureComponent {

    constructor(props, context) {
        super(props, context);

        this.state = {open: false};

        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    render() {
        const {children, options, disabled, position} = this.props;
        const {open} = this.state;

        if (disabled) {
            return children;
        }

        const dropdown = open
            ? <div className={`dropdown-pane ${position || ''}`}
                   style={{display: 'block', visibility: 'visible'}}>
                {Object.entries(options).map(([o, i]) => <div key={o}>{i}</div>)}
            </div>
            : null;

        return <div className='dropdown-container'
                    ref={this.setWrapperRef}
                    onClick={() => this.setState({open: !open})}>
            <div className='dropdown-trigger'>
                {children}
            </div>
            {dropdown}
        </div>
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    setWrapperRef(node) {
        this.wrapperRef = node;
    }

    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.setState({open: false});
        }
    }
}

export function renderMarkdown(str) {
    return renderer.render(parser.parse(str))
}
