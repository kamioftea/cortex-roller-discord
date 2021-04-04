const authenticated = (role = null, json = false) => (req, res, next) => {
    if(!req.user) {
        res.status(401);
        return json
            ? res.json({error: 'Access Denied - Not Logged In'})
            : res.render('auth/unauthorised', { title: '', redirect_url: req.baseUrl + req.url});
    }

    if(role && (!Array.isArray(req.user.roles) || !req.user.roles.includes(role)))
    {
        res.status(403);
        return json
            ? res.json({error: 'Access Denied - Forbidden'})
            : res.render('auth/forbidden', { title: 'Forbidden' });

    }

    next();
};

module.exports = {
    authenticated
};
