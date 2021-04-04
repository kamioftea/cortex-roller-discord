const readMessage = (req, res, next) => {
    if (req.session.message) {
        res.locals.message = req.session.message;
        req.session.message = null;
    }
    next();
};

const writeMessage = (req, text, severity = 'success') =>
    req.session.message = {
        severity,
        text
    };

const updateCurrentMessage = (req, text, severity = 'success') =>
    req.locals.message = {
        severity,
        text
    };

module.exports = {
    readMessage,
    writeMessage,
    updateCurrentMessage,
};
