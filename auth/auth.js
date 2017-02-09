"use strict";

function setupAuth(User, app) {

    let fbConfig = require('./../fbconfig');
    let config = require('./../config');

    let passport = require('passport');
    let FacebookStrategy = require('passport-facebook').Strategy;

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        User.findOne({_id: id}).exec(done);
    });

    passport.use(new FacebookStrategy(
        {
            clientID: fbConfig.clientId,
            clientSecret: fbConfig.secret,
            callbackURL: config.host + ':' + config.port + '/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name', 'displayName']
        },
        function (accessToken, refreshToken, profile, done) {
            if (!profile.emails || !profile.emails.length) {
                return done('No emails associated with this account');
            }
            const emails = profile.emails.map(email => email.value);
            User.findOneAndUpdate(
                {'email': { $in: emails }},
                {
                    $set: {
                        'oauth': profile.id,
                        'email': profile.emails[0].value,
                        'name': profile.displayName,
                        'picture': 'http://graph.facebook.com/' + profile.id.toString() + '/picture?type=large'
                    }
                },
                {'new': true, upsert: true, runValidators: true},
                function (error, user) {
                    done(error, user);
                }
            )

        }
    ));

    app.use(require('express-session')({
        secret: fbConfig.secret,
        resave: true,
        saveUninitialized: true
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {failureRedirect: '/fail'}),
        function (req, res) {
            //TODO return JWT
            res.send('Welcome, ' + req.user.name);
        });

}

module.exports = setupAuth;