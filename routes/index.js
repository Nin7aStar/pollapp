var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Poll = mongoose.model('Polls');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Real Time poll application' });
});

/* View the all polls */
router.get('/polls/all', function (req, res) {
	Poll.find({}, 'question', function(error, polls) {
		res.json(polls);
	});
});

/* View the selected poll item */
router.get('/polls/:id', function (req, res) {
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
router.post('/polls/new', function (req, res) {
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

module.exports = router;
