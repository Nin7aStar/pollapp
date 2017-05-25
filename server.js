var express = require('express');
var path = require('path');
var http = require('http');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/pollsapp');
var Poll = require('./models/Polls');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.set('port', process.env.PORT || 3000);
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

var server = http.createServer(app);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log('Socket succesfully connected with id: '+socket.id);   // for debug
    //Socket API for saving a vote
    socket.on('send:vote', function (data) {
        var ip = socket.handshake.headers['x-forward-for'] || socket.handshake.address.address;
        Poll.findById(data.poll_id, function(err, poll) {
            var choice = poll.choices.id(data.choice);
            choice.votes.push({ip: ip});
            poll.save(function(err, doc) {
                var theDoc = {
                    question: doc.question,
                    _id: doc._id,
                    choices: doc.choices,
                    userVoted: false,
                    totalVotes: 0
                };
                for(var i = 0, ln = doc.choices.length; i < ln; i++) {
                    var choice = doc.choices[i];
                    for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
                        var vote = choice.votes[j];
                        theDoc.totalVotes++;
                        theDoc.ip = ip;
                        if (vote.ip === ip) {
                            theDoc.userVoted = true;
                            theDoc.userChoice = { _id: choice._id, text: choice.text };
                        }
                    }
                }
                socket.emit('myvote', theDoc);
                socket.broadcast.emit('vote', theDoc);
            });
        });
    });
});

server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

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

/* Vote a poll's choice */
// app.post('/vote', function(socket) {
// 	//Socket API for saving a vote
// 	socket.on('send:vote', function (data) {
// 		var ip = socket.handshake.headers['x-forward-for'] || socket.handshake.address.address;
// 		Poll.findById(data.poll._id, function(err, poll) {
// 			var choice = poll.choices.id(data.choice);
// 			choice.votes.push({ip: ip});
// 			poll.save(function(err, doc) {
// 				var theDoc = {
// 					question: doc.question,
// 					_id: doc._id,
// 					choices: doc.choices,
// 					userVoted: false,
// 					totalVotes: 0
// 				};
// 				for(var i = 0, ln = doc.choices.length; i < ln; i++) {
// 					var choice = doc.choices[i];
// 					for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
// 						var vote = choice.votes[j];
// 						theDoc.totalVotes++;
// 						theDoc.ip = ip;
// 						if (vote.ip === ip) {
// 							theDoc.userVoted = true;
// 							theDoc.userChoice = { _id: choice._id, text: choice.text };
// 						}
// 					}
// 				}
// 				socket.emit('myvote', theDoc);
// 				socket.broadcast.emit('vote', theDoc);
// 			});
// 		});
//     });
// });

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
