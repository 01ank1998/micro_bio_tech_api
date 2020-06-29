/**
 * @type Database Utility
 * @desc Utility for connecting to the MongoDB database using mongoose ODM
 */

const mongoose = require('mongoose');
const config = require('config');
const initializeDB = require('./initialize-db');
const dbHelpers = require('./setup-db-helpers');

/* Connect to the MongoDB database */
var state = {
  db: null,
};

exports.connect = async function() {
  if (state.db) return;

  const url = `mongodb://${config.get('db.host')}:${config.get('db.port')}/${config.get('db.name')}`;
  const db = await mongoose.connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true
  });
  state.db = db;
};

exports.get = function() {
  return state.db;
};

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err) {
      state.db = null;
      state.mode = null;
      done(err);
    });
  }
};

exports.setupHelpers = async function() {
  dbHelpers.setup();
  initializeDB.addUser();
};