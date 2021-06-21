// a Very Bad readme generator
import doctrine from 'doctrine';
import fs from 'fs';
import getHacks from './getHacks';

const l = getHacks().length;
const headers = [];

function write() {
	var contents = headers
		.filter((h) => h)
		.map((header) => doctrine.parse(header, {
			unwrap: true,
			recoverable: true,
		}))
		.map((jsdoc) => {
			var o = {};
			o.emoji = jsdoc.description;
			for (var i in jsdoc.tags) {
				o[jsdoc.tags[i].title] = jsdoc.tags[i].description;
			}
			o.file = o.file || '';
			o.url = `/dist/${encodeURI(o.file.replace(/\s/g, '-'))}.js`;
			return o;
		})
		.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
	fs.writeFileSync('README.md', `# flickguy-hacks

A collection of re-usable scripts for [candle](https://twitter.com/ragzouken)'s [flickguy](https://kool.tools/flickguy).

- [Contents](#contents)
- [How to use](#how-to-use)

## Contents

${contents.map((hack) => `- ${hack.emoji} [${hack.file}](${hack.url}): ${hack.summary}`).join('\n')}

## How to use

Each script has a short "HOW TO USE" section included in the comments. For steps which say to \`Copy-paste this script into a script tag in your flickguy\`, open your exported flickguy and scroll to the bottom of the file (at the time of writing, it looks like this):

\`\`\`html
</body></html>
\`\`\`

then edit it to look like this:

\`\`\`html
<script>
  // and then paste your code here!
</script>

</body></html>
\`\`\``);
}

export default function (options = {}) {
	return {
		// grab headers
		renderChunk(code) {
			const pattern = /^(\/\*\*[\S\s]*?\*\/)$/gm;
			const matches = code.match(pattern);
			if (!matches) {
				console.warn("Couldn't find jsdoc");
				headers.push(null);
				return code;
			}
			const header = matches[matches.length - 1];
			headers.push(header);
			return code;
		},
		writeBundle() {
			if (headers.length === l) {
				write();
			}
		},
	};
}
