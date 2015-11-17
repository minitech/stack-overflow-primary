Warning: this project is not particularly well-written.


## Setup

Fill `cookies.json` with your cookies and immediately clear them from your browser(s) (not by logging out):

```json
[
	["prov", "prov=abcdefgh-0123-4567-890zxcvbnmasd"],
	["acct", "acct=t=…&s=…"],
	["sgt", "sgt=id=…"]
]
```

---

If current values weren’t already included in `config.json`, you could grab `nominations` and `users` from the primary page:

```javascript
var users = {};
var nominations = $('[id^="post-"]').map(function () {
	var userLink = $(this).find('.user-details a');
	var post = this.id.split('-')[1] | 0;
	var user = userLink.attr('href').match(/\d+/)[0] | 0;

	users[user] = userLink.text();

	return {
		post: post,
		user: user,
	};
}).get();
```

Also in `config.json`: `root` should be the path to the application (e.g. `/primary`), without a trailing slash.

---

Install dependencies:

```shellsession
$ npm install
```

---

Run the server:

```shellsession
$ node application
```

---

Now configure a reverse proxy somehow. It should delegate to `[::1]:5000` with no buffering on `/events`.
