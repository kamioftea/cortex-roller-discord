import {List, Record} from 'immutable';

const SET_CAMPAIGN = Symbol('SET_CAMPAIGN');

const Campaign = Record({
    _id: '',
    title: '',
    slug: '',
    icon_url: '',
    banner_url: '',
    description: '',
    users: List(),
})

export const setCampaign = campaign => ({
    type: SET_CAMPAIGN,
    campaign: Campaign({...campaign, users: List(campaign.users)}),
})

export const campaignReducer = (state = null, action) => {
    switch (action.type) {
        case SET_CAMPAIGN:
            return action.campaign;
        default:
            return state;
    }
}
