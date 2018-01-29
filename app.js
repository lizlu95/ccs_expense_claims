const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const uuidv4 = require('uuid/v4');
const Sequelize = require('sequelize');

// routes
const index = require('./routes/index');
const login = require('./routes/authenticate/login');
const logout = require('./routes/authenticate/logout');

const port = process.env.PORT || 3000;
const app = module.exports = express();

// database setup
app.connection = require('./database');

// models
const models = require('./models/index');
const Employee = models.Employee;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: uuidv4() }));
app.use(passport.initialize());
app.use(passport.session());

// passport middleware
passport.use(new LocalStrategy(
  function(email, password, done) {
    Employee.findOne({
      where: {
        email: email,
      }
    }).then((employee) => {
      if (!employee) {
        return done(null, false, { message: 'Incorrect username.' });
      } else {
        if (employee.password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        } else {
          return done(null, employee);
        }
      }
    });
  }
));

passport.serializeUser(function(employee, done) {
  done(null, employee.id);
});

passport.deserializeUser(function(id, done) {
  Employee.findById(id).then((employee) => {
    done(null, employee);
  });
});

app.use('/', index);
app.use('/login', login);
app.use('/logout', logout);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.server = app.listen(port, function () {
  console.log('Listening on port ' + port + '!');
});

// app process exit
process.on('exit', function () {
  // TODO possibly check for a better graceful exit
  app.connection.close();
});
