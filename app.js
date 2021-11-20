const express = require('express');
const hbs = require('hbs')
const createError = require('http-errors');
const path = require('path');
const fs = require('fs');
const glob = require('glob-promise');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const sass = require('sass');
const passport = require('./passport');
const {authenticated} = require('./authenticateRequest');
const {registerEpic} = require('./model');
const {readMessage} = require('./flashMessage');
const {Subject} = require('rxjs');

const {ofType} = require('redux-observable');
const session = require('express-session');

const MongoDBStore = require('connect-mongodb-session')(session);

const {withCampaign} = require('./middleware/withCampaign');

const indexRouter = require('./routes/index');
const assetsRouter = require('./routes/assests');
const campaignsRouter = require('./routes/campaigns/index');
const charactersRouter = require('./routes/characters');
const narratorRouter = require('./routes/narrator');
const snippetsRouter = require('./routes/snippets');
const usersRouter = require('./routes/users');
const diceRollerRoute = require('./routes/dice-roller');

const fromClientTypes = [
    'trigger-scene-change',
    'set-dice',
    'roll-dice',
    'update-result',
    'clear-roll',
    'alter-stress',
    'alter-plot-points',
    'update-snippet',
    'update-active-snippet',
];
const toClientTypes = [
    'roll-updated',
    'dice-rolled',
    'set-characters',
    'set-character-player',
    'roll-cleared',
    'set-active-snippet',
    'set-asset',
    'remove-asset',
    'set-snippet',
    'remove-snippet',
];

module.exports = app => {

    app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

    hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

    glob(path.join(__dirname, 'helpers') + '/**/*.js')
        .then(files =>
            files.forEach(file => hbs.registerHelper(path.basename(file, '.js'), require(file)))
        )

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'hbs');

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use(bodyParser.raw({type: 'image/*', limit: '8mb'}));
    app.use(cookieParser());

    app.use(session({
        secret:            process.env.SESSION_SECRET,
        cookie:            {
            maxAge: 1000 * 60 * 60 * 24 * 8 // 1 week + 1 day
        },
        resave:            false,
        saveUninitialized: false,
        store:             new MongoDBStore({
            uri:        process.env.MONGO_URL,
            collection: 'cortex-session'
        })
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(readMessage);

    const sassResult = sass.renderSync({
        file:           path.join(__dirname, 'public', 'stylesheets', 'style.scss'),

        indentedSyntax: false, // true = .sass and false = .scss
        sourceMap:      true,
        quietDeps:      true,
        includePaths:   [
            path.join(__dirname, 'node_modules', 'foundation-sites', 'scss'),
            path.join(__dirname, 'res', 'fontawesome', 'fontawesome-pro', 'scss'),
            path.join(__dirname, 'node_modules', 'motion-ui', 'src'),
        ]
    });

    fs.writeFileSync(
        path.join(__dirname, 'public', 'stylesheets', 'style.css'),
        sassResult.css
    );

    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/js', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
    app.use('/js', express.static(path.join(__dirname, 'node_modules', 'foundation-sites', 'dist', 'js', 'plugins')));
    app.use('/webfonts', express.static(path.join(__dirname, 'res', 'fontawesome', 'fontawesome-pro', 'webfonts')));

    app.get(
        '/authorise',
        passport.authenticate('oauth2', {failureRedirect: '/'}),
        (req, res) => res.redirect('/')
    );

    app.use('/listen/:id', authenticated());
    app.ws('/listen/:id', async (ws, req) => {
        try {
            const _campaign_id = req.params.id;
            const user = req.user;
            const ws$ = new Subject();

            let actionSubscription = null;

            const resultSubscription = registerEpic((msg$) => {
                actionSubscription =
                    msg$.pipe(
                        ofType(...toClientTypes))
                        .subscribe(
                            (msg) => {
                                if(msg._campaign_id != null && msg._campaign_id.toString() !== _campaign_id) {
                                    return;
                                }
                                if (msg._for != null && !msg._for.map(id => id.toString()).includes(user._id.toString())) {
                                    return;
                                }
                                try {
                                    ws.send(JSON.stringify(msg))
                                } catch (err) {
                                    console.log('Error sending message', msg, err)
                                }
                            }
                        );
                return ws$;
            });

            ws$.next({type: 'user-connected', user, _campaign_id});

            const intervalID = setInterval(() => ws.send(JSON.stringify({type: 'ping'})), 5000);

            ws.on('message', data => {
                try {
                    const msg = JSON.parse(data);
                    if (fromClientTypes.includes(msg.type)) {
                        ws$.next({...msg, _sender: user, _campaign_id});
                    }
                } catch (err) {
                    console.error(err)
                }
            });

            ws.on('close', () => {
                clearInterval(intervalID);
                if (actionSubscription) {
                    actionSubscription.unsubscribe();
                }
                resultSubscription.unsubscribe();

                ws$.next({type: 'user-disconnected', user, _campaign_id})
            })

            ws.send(JSON.stringify({type: 'set-user', user, _campaign_id}));
        } catch (err) {
            console.log(err)
        }
    });

    app.use((req, res, next) => {
        res.locals.base_url = req.baseUrl;
        next();
    })

    const inCampaignRouter = express.Router();

    inCampaignRouter.use('/asset', assetsRouter);
    inCampaignRouter.use('/character', charactersRouter);
    inCampaignRouter.use('/narrator', narratorRouter);
    inCampaignRouter.use('/snippet', snippetsRouter);
    diceRollerRoute(inCampaignRouter);

    app.use('/campaign', campaignsRouter);
    app.use('/user', usersRouter(passport));
    app.use('/:campaignSlug', withCampaign)
    app.use('/:campaignSlug', inCampaignRouter)
    app.use('/', indexRouter);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        next(createError(404));
    });

// error handler
    app.use(function (err, req, res) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });
}
