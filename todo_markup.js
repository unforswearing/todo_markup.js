const fs = require('fs')

/*
todo_markup.js -- simplified markup for todo-focused notes

usage: 
	todo_markup.js "file.md" (to html)
	todo_markup.js --ast "file.md" (a basic AST-like structure of "file.md" contents)	

	shortly:
	todo_markup.js --notes "notes.md"
	todo_markup.js --tasks "tasks.md"
	todo_markup.js --comments "tasks.md"
	todo_markup.js --urls "tasks.md"

	eventually:
	todo_markup.js --ast "notes.json" (notes only AST)
	todo_markup.js --preprocess "file.md" (convert to markdown i/o html where possible)
*/

// TODO: process args

// process.argv[2] will change when more arg options are added
const INPUT_FILE = fs.readFileSync(process.argv[2], 'utf8')
const INPUT_LINES = INPUT_FILE.split('\n')

let words_tmp = new Array()
for (let v = 0; v < INPUT_LINES.length; v++) {
	words_tmp.push(INPUT_LINES[v].split('\W'))
}

const INPUT_WORDS = words_tmp.flat()

// each item should start the line -- no nested todo grammar. 
// 	formatting will only apply to the first item found by the parser
const LANG_OPERATORS = /(^x|^\@|^>|^\!|^\#|^\%|^\=|\^|\+)/
const GRAMMAR = {
	HEADER: /^\#/,
	SUBHEAD: /^\=/,
	TODO_INCOMPLETE: /^\!/,
	TODO_DONE: /^x/,
	COMMENT: /^%/,
	FOOTNOTE: /^\@/,
	URL: /\^/,
  HIGHLIGHT: /^>/,
  /*
  ADWARNING: //,
  ADNOTE: //,
  ADIMPORTANT: //,
  */
	TEXT: /(?!${LANG_OPERATORS})([aA-zZ0-9]+|\s+|'|"|\.)/,
	NEWLINE: /(\n+|^.*$)/,
};

const GRAMMAR_KEYS = Object.keys(GRAMMAR)

const emptyString = ' '.trim();
// from the internet somewhere... need source
const fullURL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
// const projectName = /\+([aA-zZ]+|[0-9]+)(?=\s)/;

let fnTally = 0

let META = new Array();
let AST_COLLECTOR = new Array();
let FOOTNOTES = new Array()
let CACHE = new Array()
let STATUS = {
	TODO_INCOMPLETE: new Array(),
	TODO_DONE: new Array()
};

const parseURL = (unit) => {
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

const astEntry = (grammarKey, regex, matchedLine) => {
	AST_COLLECTOR.push({
		key: grammarKey, re: regex, full_line: matchedLine.trim()
	})
};

function NEWLINE(unit) { return unit; };
function URL(unit) {
	if (!unit) return unit;
	META.push({'URL': unit})
	return `<a href="${unit}">${unit}</a>`
};
function TEXT(unit) {
	if (!unit) return '<br />';
	return parseURL(unit); 
};
function COMMENT(unit) {
	META.push({'COMMENT': unit})
	return emptyString;
};
function HEADER(unit) {
	if (!unit) return;
	return `<h1>${parseURL(unit)}</h1>`
};
function SUBHEAD(unit) {
	if (!unit) return;
	return `<h2>${parseURL(unit)}</h2>`
};
function TODO_INCOMPLETE(unit) {
	if (!unit) return;
	return `<input type="checkbox"> ${parseURL(unit)}</input>`;
};
function TODO_DONE(unit) {
	if (!unit) return;
  let timestamp = new Date().toString().substring(0,21);
	return `
  <del>
    <input type="checkbox" checked>${parseURL(unit)}</input>
  </del>&nbsp;<code>${timestamp}</code>`
};
function HIGHLIGHT(unit) {
	if (!unit) return;
	return `<mark>${parseURL(unit)}</mark>`
};
function ADNOTE(unit) {
};
function ADWARNING(unit) {
};
function ADIMPORTANT(unit) {
};
function FOOTNOTE(unit) {
	if (!unit) return;
	unit = parseURL(unit);
	let fnTemplate = `<span id="fn-${fnTally}">
	<small>[<a href="#fnsrc-${fnTally}">${fnTally}</a>]: ${unit}</small>
</span>`
	FOOTNOTES.push(fnTemplate)
	let footnoteHref = `<a id="fnsrc-${fnTally}" href="#fn-${fnTally}"><sup>${fnTally}</sup></a>`
	fnTally++
	return footnoteHref
};

const PARSER = {
	'TEXT': TEXT,
	'COMMENT': COMMENT,
	'FOOTNOTE': FOOTNOTE,
	'HEADER': HEADER,
	'SUBHEAD': SUBHEAD,
	'TODO_INCOMPLETE': TODO_INCOMPLETE,
	'TODO_DONE': TODO_DONE,
	'URL': URL,
	'HIGHLIGHT': HIGHLIGHT,
  /*
  ADWARNING: ADWARNING,
  ADNOTE: ADNOTE,
  ADIMPORTANT: ADIMPORTANT,
  */
	'NEWLINE': NEWLINE,
};

// inputLoop:
for (let n = 0; n < INPUT_LINES.length; n++) {
	let u = n === 0 ? n : n - 2;
	let LINE = INPUT_LINES[n]
	let PREV_LINE = INPUT_LINES[u]
	let WORDS = LINE.split(' ')
	wordsLoop:
	for (let q = 0; q < WORDS.length; q++) {
		if (WORDS[q].match(GRAMMAR.URL)) WORDS[q] = PARSER.URL(WORDS[q]);
		let word = WORDS[0]
		// grammarLoop:
		for (let r = 0; r < GRAMMAR_KEYS.length; r++) {
			let KEY = GRAMMAR_KEYS[r]
			if (PARSER[KEY] && word.match(GRAMMAR[KEY])) {
				if (KEY !== 'TEXT') WORDS.shift();
				if (KEY === 'FOOTNOTE') {
					CACHE[u] = PREV_LINE.trim() + PARSER[KEY](WORDS.join(' '))
					astEntry(KEY, GRAMMAR[KEY], WORDS.join(' '))
					break wordsLoop;
				}
			    if ((KEY === 'TODO_INCOMPLETE') || (KEY === 'TODO_DONE')) {
			    	STATUS[KEY].push(WORDS.join(' '))
			    }
				CACHE.push(PARSER[KEY](WORDS.join(' ')))
				break wordsLoop;
			}
		}
	}
}

CACHE.push('<hr />')
CACHE.push('<details><summary>Footnotes</summary>')
CACHE.push(FOOTNOTES.join('<br />'))
CACHE.push('</details>')

let HTML_COLLECTOR = new Array()

for (let entry = 0; entry < CACHE.length; entry++) {
	if (CACHE[entry] !== "\n") HTML_COLLECTOR.push(CACHE[entry])
}

const AST = {...AST_COLLECTOR}
const HTML = HTML_COLLECTOR.join('<p />')

// console.log(AST, HTML, META)
// console.log(AST)
console.log(HTML)

















