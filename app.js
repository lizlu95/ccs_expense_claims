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
const Op = Sequelize.Op;
const sassMiddleware = require('node-sass-middleware');
const vueOptions = {
  rootPath: path.join(__dirname, '/views'),
  layout: {
    start: '<div id="expense-claim-app">',
    end: '</div>'
  }
};
const expressVueMiddleware = require('express-vue').init(vueOptions);

// routes
const index = require('./routes/index');
const login = require('./routes/authenticate/login');
const logout = require('./routes/authenticate/logout');
const claims = require('./routes/claims');
const reports = require('./routes/admin/reports');

const app = module.exports = express();

// models
const models = require('./models/index');
const Employee = models.Employee;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(sassMiddleware({
  src: path.join(__dirname, 'scss'),
  dest: path.join(__dirname, 'public'),
  outputStyle: 'compressed',
}));
app.use(expressVueMiddleware);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: uuidv4(),
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// passport middleware
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function(email, password, done) {
    // TODO stored procedure
    Employee.findOne({
      where: {
        email: {
          [Op.eq]: email,
        }
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

// globally accessible routes
app.use('/login', login);

app.use(function (req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
});

// login protected routes
app.use('/', index);
app.use('/logout', logout);
app.use('/claims', claims);
app.use('/reports', reports);

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
