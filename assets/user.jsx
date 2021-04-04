const SET_USER = Symbol('set-user');

export const setUser = ({user}) => ({type: SET_USER, user});

export function userReducer(state = null, action) {
    switch (action.type) {
        case SET_USER:
            return action.user;

        default:
            return state;
    }
}


