const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const config = require('./env');

// Verify callback only extracts/normalizes the Google profile — it deliberately
// does no DB access. Finding-or-creating the user is business logic and belongs
// in auth.service.js, called from the /auth/google/callback controller.
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    (googleAccessToken, googleRefreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value || null;
      const avatar = profile.photos?.[0]?.value || null;
      const displayNameParts = (profile.displayName || '').trim().split(/\s+/).filter(Boolean);

      const firstName = profile.name?.givenName || displayNameParts[0] || 'Google';
      const lastName = profile.name?.familyName || displayNameParts.slice(1).join(' ') || 'User';

      done(null, { email, firstName, lastName, avatar });
    }
  )
);

module.exports = passport;
