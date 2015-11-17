'use strict';

var CookieJar = require('./cookie-jar').CookieJar;
var events = require('events');
var http = require('http');
var https = require('https');
var path = require('path');
var piecewise = require('piecewise');

var config = require('./config');
var nominations = config.nominations;
var requestDelay = config.requestDelay;
var root = config.root;

var cookies = new CookieJar([]);
var currentRequest = 0;

var primary = new events.EventEmitter();
var votes = {};

var saveCookies = (function () {
	var writing = false;
	var waiting = null;

	return function saveCookies() {
		function task() {
			writing = true;

			cookies.save(config.cookieJar, function (error) {
				if (error) {
					console.error(error);
				}

				if (waiting) {
					waiting();
					waiting = null;
				} else {
					writing = false;
				}
			});
		}

		if (waiting) {
			return;
		}

		if (writing) {
			waiting = task;
		} else {
			task();
		}
	};
})();

function parseVoteCount(voteCount) {
	var c = voteCount | 0;
	return c < 0 ? -c : c;
}

function readJSON(stream, callback) {
	var parts = [];

	stream.on('data', function (part) {
		parts.push(part);
	});

	stream.on('end', function () {
		var data;
		var json = Buffer.concat(parts).toString('utf8');

		try {
			data = JSON.parse(json);
		} catch (error) {
			callback(error);
			return;
		}

		callback(null, data);
	});

	stream.on('error', callback);
}

function nextRequest() {
	function delayNextRequest() {
		setTimeout(nextRequest, requestDelay);
	}

	var nomination = nominations[currentRequest++ % nominations.length];

	var request = https.get({
		hostname: 'stackoverflow.com',
		path: `/posts/${nomination.post}/vote-counts`,
		headers: {
			'Cookie': cookies.getCookieHeader(),
		},
	});

	request.on('response', function (response) {
		if ('set-cookie' in response.headers) {
			cookies.update(response.headers['set-cookie']);
			saveCookies();
		}

		readJSON(response, function (error, data) {
			if (error) {
				console.error(error.stack);
			} else {
				var up = parseVoteCount(data.up);
				var down = parseVoteCount(data.down);
				var userVotes = {
					up: up,
					down: down,
				};

				primary.emit('votes', {
					user: nomination.user,
					votes: userVotes,
				});

				votes[nomination.user] = userVotes;
			}

			delayNextRequest();
		});
	});

	request.on('error', function (error) {
		console.error(error.stack);
		delayNextRequest();
	});
}

piecewise.filters.inlineJSON = function inlineJSON(data) {
	var json = JSON.stringify(data);

	return json.replace(/<\//g, '<\\/')
	           .replace(/<!--/g, '<\\!--');
};

var templates = new piecewise.DirectoryLoader(path.join(__dirname, 'templates'));
var indexTemplate = templates.load('index', { root: root });
var server = http.createServer();

function serveEvents(request, response) {
	response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8' });

	function sendVotes(data) {
		response.write('data: ' + JSON.stringify(data) + '\n\n');
	}

	primary.on('votes', sendVotes);

	response.on('close', function () {
		primary.removeListener('votes', sendVotes);
	});
}

function serveIndex(request, response) {
	response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
	response.end(indexTemplate.render({
		users: config.users,
		votes: votes,
	}));
}

server.on('request', function (request, response) {
	var url = request.url;

	if (url === root || url === root + '/') {
		serveIndex(request, response);
	} else if (url === root + '/events') {
		serveEvents(request, response);
	} else {
		response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end('Not found!');
	}
});

cookies.load(config.cookieJar, function (error) {
	if (error) {
		console.error(error.stack);
	} else {
		server.listen(5000, '::1');
		nextRequest();
	}
});
