'use strict';

var fs = require('fs');

function CookieJar(cookies) {
	this.cookies = new Map(cookies);
}

CookieJar.prototype.getCookieHeader = function getCookieHeader() {
	return Array.from(this.cookies.values()).join('; ');
};

CookieJar.prototype.update = function update(setCookieHeaders) {
	setCookieHeaders.forEach((cookie) => {
		var pair = cookie.split(';')[0];
		var name = pair.substring(0, pair.indexOf('='));

		this.cookies.set(name, pair);
	});
};

CookieJar.prototype.load = function load(filePath, callback) {
	fs.readFile(filePath, 'utf8', (error, contents) => {
		if (error) {
			callback(error);
			return;
		}

		var cookies;

		try {
			cookies = JSON.parse(contents);
		} catch (parseError) {
			callback(parseError);
			return;
		}

		this.cookies = new Map(cookies);

		callback(null);
	});
};

CookieJar.prototype.save = function save(filePath, callback) {
	fs.writeFile(filePath, JSON.stringify(Array.from(this.cookies.entries())), 'utf8', callback);
};

exports.CookieJar = CookieJar;
