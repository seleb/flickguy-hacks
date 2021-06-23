// download original flickguy and inject all hacks into it
const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest, cb) {
	const file = fs.createWriteStream(dest);
	https
		.get(url, function (response) {
			response.pipe(file);
			file.on('finish', function () {
				file.close(cb);
			});
		})
		.on('error', function (err) {
			cb(err.message);
		});
}

download('https://kool.tools/flickguy/index.html', './docs/index.html', (err) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	const text = fs.readFileSync('./docs/index.html', { encoding: 'utf-8' });
	const hacks = fs.readdirSync('./dist');
	const hackText = hacks.reduce((result, hack) => result + fs.readFileSync(path.join('./dist', hack)), '');
	const demo = text.replace(/<\/body>/, '<script>' + hackText + '</script></body>');
	fs.writeFileSync('./docs/index.html', demo, { encoding: 'utf-8' });
});
