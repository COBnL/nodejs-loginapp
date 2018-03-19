const fs = require('fs');
const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const Token = require('keycloak-connect/middleware/auth-utils/token');
const loginappConfig = require('./config/loginapp.json');
const keycloakConfig = require('./config/keycloak.json');
const apiserverConfig = require('./config/apiserver.json');

// fix keycloak-connect bug when using offline tokens
Token.prototype.isExpired = function isExpired() {
  if (this.content.typ === 'Offline') {
    return false;
  }

  return ((this.content.exp * 1000) < Date.now());
};

const app = express();
const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({
  store: memoryStore,
  scope: 'offline_access'
}, keycloakConfig);

if (!apiserverConfig.ca) {
  apiserverConfig.ca = fs.readFileSync(apiserverConfig.caPath, {encoding: 'base64'});
}

app
  .set('view engine', 'ejs')
  .set('views', './views')
  .set('trust proxy', true)
  .use(session({
    secret: loginappConfig.secret,
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  }))
  .use(keycloak.middleware());

app
  .use('/assets', express.static('assets'))
  .get('/', keycloak.protect(), (req, res) => {
    console.log(`Authenticated ${req.kauth.grant.id_token.content.preferred_username}`);
    res.render('index', {
      apiserverConfig,
      keycloakConfig,
      idToken: req.kauth.grant.id_token,
      refreshToken: req.kauth.grant.refresh_token
    });
  });

app.listen(loginappConfig.port, () => console.log(`Application started at port ${loginappConfig.port}`));
