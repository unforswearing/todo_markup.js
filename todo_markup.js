const fs = require('fs')

/*
todo_markup.js -- simplified markup for todo-focused notes

usage: 
	todo_markup.js "file.md" (to html)

	shortly:
	todo_markup.js --json "file.md" (a basic AST-like structure of "file.md" contents)	

	eventually:
	todo_markup.js --preprocess "file.md" (convert to markdown i/o html where possible)
	todo_markup.js --get-notes [--json] "file.md" (notes only AST)
	todo_markup.js --get-tasks [--json] "file.md" (tasks only AST)
*/

const INPUT_FILE = fs.readFileSync(process.argv[2], 'utf8')
const INPUT_LINES = INPUT_FILE.split('\n')

let words_tmp = new Array()
for (let v = 0; v < INPUT_LINES.length; v++) {
	words_tmp.push(INPUT_LINES[v].split('\W'))
}

const INPUT_WORDS = words_tmp.flat()

// each item should start the line -- no nested todo grammar. 
// 	formatting will only apply to the first item found by the parser
const GRAMMAR = {
	HEADER: /^\#/,
	SUBHEAD: /^\=/,
	TODO_INCOMPLETE: /^\!/,
	TODO_DONE: /^x/,
	COMMENT: /^%/,
	FOOTNOTE: /^\@/,
	URL: /\^/,
	CALLOUT: /^>/,
	TEXT: /(?!(^x|^\@|^>|^\!|^\#|^\%|^\=|\^))([aA-zZ0-9]+|\s+|'|"|\.)/,
	NEWLINE: /(\n+|^.*$)/,
};

const GRAMMAR_KEYS = Object.keys(GRAMMAR)

let META = new Array()

function URL(unit) {
	if (!unit) return unit;
	let tmpUnit = unit.split('')
	META.push({'URL': unit})
	return `<a href="${unit}">${unit}</a>`
}

const parseURL = (unit) => {
	let fullURL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/

	let unitWords = unit.split(' ')
	for (let g = 0; g < unitWords.length; g++) {
		if (unitWords[g] && unitWords[g].match(fullURL)) {
			let matched = unitWords[g].split('')
			matched.shift()
			unitWords[g] = PARSER.URL(matched.join(''))
		}
	}
	return unitWords.join(' ')
}

function TEXT(unit) {
	if (!unit) return '<br />';
	return parseURL(unit) + '<br />'; 
};

function COMMENT(unit) {
	META.push({'COMMENT': unit})
	return ' '.trim();
}

function HEADER(unit) {
	if (!unit) return;
	return `<h1>${parseURL(unit)}</h1>`
}

function SUBHEAD(unit) {
	if (!unit) return;
	return `<h2>${parseURL(unit)}</h2>`
}

function TODO_INCOMPLETE(unit) {
	if (!unit) return;
	return `<input type="checkbox"> ${parseURL(unit)}</input>`;
};

function TODO_DONE(unit) {
	if (!unit) return;
	return `<del><input type="checkbox" checked>${parseURL(unit)}</input></del>`
};

function CALLOUT(unit) {
	if (!unit) return;
	return `<mark>${parseURL(unit)}</mark><br />`
};

let FOOTNOTES = new Array()
let fnTally = 0

function FOOTNOTE(unit, ln) {
	if (!unit) return;
	unit = parseURL(unit);
	let fnTemplate = `<span id="fn-${fnTally}">
	<small>[<a href="#fnsrc-${fnTally}">${fnTally}</a>]: ${unit}</small>
</span>`
	FOOTNOTES.push(fnTemplate)
	let footnoteHref = `<small>
	<code>
		> See Footnote <sup>
			<a id="fnsrc-${fnTally}" href="#fn-${fnTally}">[${fnTally}]</a>
		</sup>
	</code>
</small>
<br />`
	fnTally++
	return footnoteHref
};

function NEWLINE(unit) { return unit; };

const PARSER = {
	'TEXT': TEXT,
	'COMMENT': COMMENT,
	'FOOTNOTE': FOOTNOTE,
	'HEADER': HEADER,
	'SUBHEAD': SUBHEAD,
	'TODO_INCOMPLETE': TODO_INCOMPLETE,
	'TODO_DONE': TODO_DONE,
	'URL': URL,
	'CALLOUT': CALLOUT,
	'NEWLINE': NEWLINE,
};

let astCollector = new Array()

const astEntry = (grammarKey, regex, matchedLine) => {
	astCollector.push({
		key: grammarKey, re: regex, full_line: matchedLine.trim()
	})
}

let CACHE = new Array()

inputLoop:
for (let n = 0; n < INPUT_LINES.length; n++) {
	let LINE = INPUT_LINES[n]
	let WORDS = LINE.split(' ')
	wordsLoop:
	for (let q = 0; q < WORDS.length; q++) {
		if (WORDS[q].match(GRAMMAR.URL)) WORDS[q] = PARSER.URL(WORDS[q]);
		let word = WORDS[0]
		grammarLoop:
		for (let r = 0; r < GRAMMAR_KEYS.length; r++) {
			let KEY = GRAMMAR_KEYS[r]
			if (PARSER[KEY] && word.match(GRAMMAR[KEY])) {
				if (KEY !== 'TEXT') WORDS.shift();
				CACHE.push(PARSER[KEY](WORDS.join(' ')))
				astEntry(KEY, GRAMMAR[KEY], WORDS.join(' '))
				break wordsLoop;
			}
		}
	}
}

CACHE.push('<hr />')
CACHE.push('<details><summary>Footnotes</summary>')
CACHE.push(FOOTNOTES.join('<br />'))
CACHE.push('</details>')

const AST = {...astCollector}
const HTML = CACHE.join('<p />')

console.log(AST)
// console.log(HTML)

















