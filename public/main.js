'use strict';

var _ready;
var primary = (function () {
	var eventSource = new EventSource(document.documentElement.getAttribute('data-events'));

	function ready(startupInfo) {
		var users = startupInfo.users;
		var votes = startupInfo.votes;
		var elements = {};

		var container = document.createElement('div');

		function render() {
			var maxVotes = Object.keys(votes).reduce(function (max, user) {
				var userVotes = votes[user];
				return Math.max(max, userVotes.up, userVotes.down);
			}, 0);

			if (maxVotes === 0) {
				return;
			}

			Object.keys(votes).forEach(function (user) {
				var userVotes = votes[user];
				var userElements = elements[user];

				userElements.positiveArrow.style.width = (userVotes.up / maxVotes * 100).toFixed(4) + '%';
				userElements.positiveArrow.firstChild.style.right = (userVotes.down / userVotes.up * 100).toFixed(4) + '%';
				userElements.positiveArrow.firstChild.textContent = userVotes.up + ' +';

				userElements.negativeArrow.style.width = (userVotes.down / maxVotes * 100).toFixed(4) + '%';
				userElements.negativeArrow.style.left = ((userVotes.up - userVotes.down) / maxVotes * 100).toFixed(4) + '%';
				userElements.negativeArrow.firstChild.textContent = '− ' + userVotes.down;
			});
		}

		function layout() {
			var userIds = Object.keys(users);
			var indexes = userIds.map(function (id, i) {
				return i;
			});

			indexes.sort(function (a, b) {
				var aVotes = votes[userIds[a]];
				var bVotes = votes[userIds[b]];

				if (!aVotes || !bVotes) {
					return !aVotes - !bVotes;
				} else {
					return (bVotes.up - bVotes.down) - (aVotes.up - aVotes.down);
				}
			});

			indexes.forEach(function (i, p) {
				var userElements = elements[userIds[i]];
				userElements.element.style.top = p * 1.8 + 'em';
			});
		}

		Object.keys(users).forEach(function (user) {
			var element = document.createElement('div');
			element.className = 'nominee';

			element.addEventListener('animationend', function () {
				element.classList.remove('changed');
			});

			var userLink = document.createElement('a');
			userLink.classList.add('nominee-name');
			userLink.href = 'https://stackoverflow.com/users/' + user;
			userLink.appendChild(document.createTextNode(users[user]));

			var votesContainer = document.createElement('span');
			votesContainer.classList.add('votes-container');

			var positiveArrow = document.createElement('span');
			var positiveVoteCount = document.createElement('span');
			positiveArrow.className = 'votes votes-positive';
			positiveArrow.appendChild(positiveVoteCount);
			var negativeArrow = document.createElement('span');
			var negativeVoteCount = document.createElement('span');
			negativeArrow.className = 'votes votes-negative';
			negativeArrow.appendChild(negativeVoteCount);

			votesContainer.appendChild(positiveArrow);
			votesContainer.appendChild(negativeArrow);

			element.appendChild(userLink);
			element.appendChild(votesContainer);
			container.appendChild(element);

			elements[user] = {
				element: element,
				positiveArrow: positiveArrow,
				negativeArrow: negativeArrow
			};
		});

		render();
		layout();

		document.body.insertBefore(container, document.body.firstChild);

		eventSource.onmessage = function (event) {
			var data = JSON.parse(event.data);
			votes[data.user] = data.votes;
			elements[data.user].element.classList.add('changed');
			render();
			layout();
		};
	}

	if (_ready) {
		ready(_startupInfo);
	}

	return { ready: ready };
})();
