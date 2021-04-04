import React from "react";

export const preventDefault = fn => (e => {
    e.preventDefault();
    fn(e)
});

export class Dropdown extends React.PureComponent {

    constructor(props, context) {
        super(props, context);

        this.state = {open: false}
    }

    render() {
        const {children, options, disabled} = this.props;
        const {open} = this.state;

        if(disabled) {
            return children;
        }

        const dropdown = open
            ? <div className='dropdown-pane' style={{display: 'block', visibility: 'visible'}}>
                {Object.entries(options).map(([o, i]) => <div key={o}>{i}</div>)}
            </div>
            : null;

        return <div className='dropdown-container' onClick={() => this.setState({open: !open})}>
            <div className='dropdown-trigger'>
                {children}
            </div>
            {dropdown}
        </div>
    }
}
