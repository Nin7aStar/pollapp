var app = angular.module('pollApp', ['pollServices', 'ngRoute']);

app.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		.when('/all', {
			templateUrl: 'partials/list.html',
			controller:	'PollListCtrl'
		})
		.when('/polls/:pollId', {
			templateUrl: 'partials/item.html',
			controller:	'PollItemCtrl'
		})
		.when('/new', {
			templateUrl: 'partials/new.html',
			controller:	'PollNewCtrl'
		})
		.otherwise({
			redirectTo: '/all'
		});
	}
]);

/**
 *	Manage the poll list
 */
app.controller('PollListCtrl', [
	'$scope',
	'Poll',
	function ($scope, Poll) {
		$scope.polls = Poll.query();
	}
]);

/**
 *	vote/view the item of poll
 */
app.controller('PollItemCtrl', [
	'$scope',
	'$routeParams',
	'Poll',
	function ($scope, $routeParams, Poll) {
		$scope.poll = Poll.get({pollId: $routeParams.pollId});
		$scope.vote = function () {
			//
		};
	}
]);

/**
 *	create a new poll question
 */
app.controller('PollNewCtrl', [
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
							$location.path('polls');
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