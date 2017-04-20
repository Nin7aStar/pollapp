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

mongoose.model('Polls', pollSchema);