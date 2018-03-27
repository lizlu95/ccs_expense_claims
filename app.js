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
const flash = require('connect-flash');
const _ = require('underscore');
const methodOverride = require('method-override');

// routes
const index = require('./routes/index');
const login = require('./routes/authenticate/login');
const logout = require('./routes/authenticate/logout');
const claims = require('./routes/claims');
const users = require('./routes/users');
const settings = require('./routes/settings');
const limits = require('./routes/limits');
const reports = require('./routes/admin/reports');
const configuration = require('./routes/configuration');

const app = module.exports = express();

// models
const database = require('./models/index');
const Employee = database.Employee;
const Configuration = database.Configuration;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(sassMiddleware({
  src: path.join(__dirname, 'scss'),
  dest: path.join(__dirname, 'public'),
  outputStyle: 'compressed',
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: uuidv4(),
  resave: true,
  saveUninitialized: true,
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// passport middleware
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function(email, password, done) {
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

app.use(function (req, res, next) {
  res.locals.currentYear = (new Date()).getFullYear().toString();

  next();
});

app.use(function (req, res, next) {
  var error = req.flash('error');
  if (!_.isEmpty(error)) {
    res.locals.error = error;
  }
  var success = req.flash('success');
  if (!_.isEmpty(success)) {
    res.locals.success = success;
  }

  next();
});

// globally accessible routes
app.use('/login', login);

app.use(function (req, res, next) {
  if (req.user) {
    Configuration.findOne({
      where: {
        name: {
          [Op.eq]: 'admin_employee_ids',
        },
      },
    }).then((adminEmployeeIdsConfiguration) => {
      if (adminEmployeeIdsConfiguration) {
        req.user.isAdmin = _.find(JSON.parse(adminEmployeeIdsConfiguration.value), (adminEmployeeId) => {
          return adminEmployeeId === req.user.id;
        }) || false;
        res.locals.isAdmin = req.user.isAdmin;
      } else {
        res.locals.isAdmin = false;
      }

      next();
    });
  } else {
    req.session.returnTo = req.path;

    res.redirect('/login');
  }
});

// login protected routes
// REST API routes

// non-REST API routes
app.use(function (req, res, next) {
  // get recent claims
  Employee.build({
    id: req.user.id,
  }).getExpenseClaims({
    order: [
      [
        'createdAt',
        'DESC',
      ],
    ],
    limit: 10,
  }).then((expenseClaims) => {
    res.locals.recentExpenseClaims = _.uniq(expenseClaims, false, (expenseClaim) => {
      return expenseClaim.id;
    });

    next();
  });
});
app.use('/', index);
app.use('/logout', logout);
app.use('/users', users);
app.use('/settings', settings);
app.use('/limits', limits);
app.use('/claims', claims);

// admin only routes
app.use(function (req, res, next) {
  if (req.user.isAdmin) {
    next();
  } else {
    var err = {
      status: 401,
    };

    next(err);
  }
});
app.use('/reports', reports);
app.use('/system/configuration', configuration);

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
