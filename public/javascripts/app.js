'use strict';
var pollApp = angular.module('pollApp', ['pollServices', 'ngRoute']);

pollApp.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		// route for the poll list page
		.when('/all', {
			templateUrl: 'partials/list.html',
			controller:	'PollListCtrl'
		})
		// route for viewing the poll item
		.when('/polls/:pollId', {
			templateUrl: 'partials/item.html',
			controller:	'PollItemCtrl'
		})
		//route for creating a new poll
		.when('/new', {
			templateUrl: 'partials/new.html',
			controller:	'PollNewCtrl'
		})
		.otherwise({
			redirectTo: '/all'
		});
}]);

/**
 *	Manage the poll list
 */
pollApp.controller('PollListCtrl', [
	'$scope',
	'Poll',
	function ($scope, Poll) {
		$scope.polls = Poll.query();
	}
]);

/**
 *	vote/view the item of poll
 */
pollApp.controller('PollItemCtrl', [
	'$scope',
	'$routeParams',
	'socket',
	'Poll',
	function ($scope, $routeParams, socket, Poll) {
		$scope.poll = Poll.get({pollId: $routeParams.pollId});
		socket.on('myvote', function (data) {
			console.dir(data);
			if (data._id === $routeParams.pollId) {
				$scope.poll = data;
			}
        });
		socket.on('vote', function(data) {
			console.dir(data);
			if (data._id === $routeParams.pollId) {
				$scope.poll.choices = data.choices;
				$scope.poll.totalVotes = data.totalVotes;
			}
		});
		$scope.vote = function () {
			console.log('vote message');	// for debug
			var pollId = $scope.poll._id,
				choiceId = $scope.poll.userVote;
			if (choiceId) {
				var voteObj = { poll_id: pollId, choice: choiceId };
				socket.emit('send:vote', voteObj);
			} else {
				alert('You must select an option to vote for');
			}
		};
	}
]);

/**
 *	create a new poll question
 */
pollApp.controller('PollNewCtrl', [
	'$scope',
	'$location',
	'Poll',
	function ($scope, $location, Poll) {
		$scope.poll = {
			question:	'',
			choices:	[ { text: '' }, { text:	'' }, { text: '' } ]
		};

		$scope.addChoice = function () {
			$scope.poll.choices.push({ text: '' });
		};

		$scope.createPoll = function () {
			var poll = $scope.poll;
			if (poll.question.length > 0) {
				var choiceCount = 0;
				for (var i=0, ln=poll.choices.length; i < ln; i++) {
					var choice = poll.choices[i];
					if (choice.text.length > 0) {
						choiceCount++;
					}
				}
				if (choiceCount > 1) {
					var newPoll = new Poll(poll);
					newPoll.$save(function(p, resp) {
						if(!p.error) {
							$location.path('all');
						} else {
							alert('Could not create poll');
						}
					});
				} else {
					alert('You must enter at least two choices');
				}
			} else {
				alert('you must enter a question');
			}
		};
	}
]);
