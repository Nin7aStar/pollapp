var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var voteSchema = new Schema({
	'ip': String
});

var choiceSchema = new Schema({
	text: String,
	votes:	[voteSchema]
});

var pollSchema = new Schema({
	question: {
		type: String,
		required: true
	},
	choices: [choiceSchema]
});

var Polls = mongoose.model('Polls', pollSchema);

module.exports = Polls;
