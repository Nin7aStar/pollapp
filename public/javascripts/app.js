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
pollApp.controller('PollNewCtrl', [
	'$scope',
	'$location',
	'Poll',
	function ($scope, $location, Poll) {
		console.log('New Event');
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
