var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/pollsapp');
var Poll = require('./models/Polls');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

/* View the all polls */
app.get('/polls/all', function (req, res) {
	Poll.find({}, 'question', function(error, polls) {
		res.json(polls);
	});
});

/* View the selected poll item */
app.get('/polls/:id', function (req, res) {
	var pollId = req.params.id;
	Poll.findById(pollId, '', { lean: true }, function (error, poll) {
		if (poll) {
			var userVoted = false,
				userChoice,
				totalVotes = 0;
			for (c in poll.choices) {
				var choice = poll.choices[c];
				for (v in choice.votes) {
					var vote = choice.votes[v];
					totalVotes++;
					if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
						userVoted = true;
						userChoice = {
							_id: choice._id,
							text: choice.text
						};
					}
				}
			}
			poll.userVoted = userVoted;
			poll.userChoice = userChoice;
			poll.totalVotes = totalVotes;
			res.json(poll);
		}
		else
		{
			res.json( { error: true });
		}
	});
});

/* Create a new poll */
app.post('/polls', function (req, res) {
	var reqBody = req.body,
		choices = reqBody.choices.filter(function (v) { return v.text != ''; }),
		pollObj = {
			question:	reqBody.question,
			choices:	choices
		};
	var poll = new Poll(pollObj);
	poll.save(function (err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			res.json(doc);
		}
	});
});

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

module.exports = app;
