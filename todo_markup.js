const fs = require('fs')
const path = require('path')
// const { Command } = require('commander');

/*
todo_markup.js -- simplified markup for todo-focused notes

usage:
  todo_markup.js notesfile.tdx <option> [outputfile]

  eg. todo_markup.js notesfile.tdx compiled_notes.html

future options:
        --ast "file.md"
        --notes
        --incomplete
        --done
        --all-tasks
        --comments
        --urls
*//*
@todo look into using commander for option parsing - https://www.npmjs.com/package/commander
@todo option to convert tdx file to markdown instead of html
*/

// arguments are captured via `process.argv`
// argv[0] = node
// argv[1] = todo_markup.js
// argv[2:] = user arguments

// get args without node and script name
// const ARGS_ARRAY = [...process.argv]
// const USER_ARGS = ARGS_ARRAY.splice(2)
/*const AVAILABLE_ARGS = [
  "--input", "--ast", "--notes", "--incomplete", "--done",
  "--all-tasks", "--comments", "--urls", "--output"
]*/

const print = (str) => console.log(str);
const usage = () => print("usage: todo_markup.js <todo_file> <argument> [output_file]");

// accept a single argument for now. accept mutliple args later...
// node todo_markup.js todo.tdx html out.html
const INPUT = process.argv[2]
const ARGUMENT = process.argv[3]
const OUTPUT = process.argv[4]

if (INPUT === "help") {
  usage()
  return
}

const INPUT_FILE = fs.readFileSync(INPUT, 'utf8')
const INPUT_LINES = INPUT_FILE.split('\n')

const FILE_META = {
  fullName: path.parse(process.argv[2]).base,
  stripped: path.parse(process.argv[2]).name,
  extension: path.parse(process.argv[2]).ext
}

let words_tmp = new Array()
for (let v = 0; v < INPUT_LINES.length; v++) {
  words_tmp.push(INPUT_LINES[v].split('\W'))
}

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
  HIGHLIGHT: /^>/,
  TEXT: /(?!${LANG_OPERATORS})([aA-zZ0-9]+|\s+|'|"|\.)/,
  NEWLINE: /(\n+|^.*$)/,
};

const GRAMMAR_KEYS = Object.keys(GRAMMAR)

// from the internet somewhere... need source
const fullURL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/

let META = new Array();
let FOOTNOTES = new Array()
let CACHE = new Array()
let STATUS = {
  TODO_INCOMPLETE: new Array(),
  TODO_DONE: new Array()
};
let AST_COLLECTOR = {};
// parseURL removes the caret char '^' from the start of urls
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

const emptyString = ' '.trim();

function NEWLINE(unit) { return unit; };
function URL(unit) {
  if (!unit) return unit;
  META.push({ 'URL': unit })
  return `<a href="${unit}">${unit}</a>`
};
function TEXT(unit) {
  if (!unit) return '<br />';
  return parseURL(unit);
};
function COMMENT(unit) {
  META.push({ 'COMMENT': unit })
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
  let timestamp = new Date().toString().substring(0, 21);
  return `
  <del>
    <input type="checkbox" checked>${parseURL(unit)}</input>
  </del>&nbsp;<code>${timestamp}</code>`
};
function HIGHLIGHT(unit) {
  if (!unit) return;
  return `<mark>${parseURL(unit)}</mark>`
};
let fnTally = 0
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
      AST_COLLECTOR[n] = {
        key: KEY,
        regex: GRAMMAR[KEY],
        line: LINE.trimEnd(),
        url: LINE.match(fullURL) ? LINE.match(fullURL)[0] : false
      }
      if (PARSER[KEY] && word.match(GRAMMAR[KEY])) {
        if (KEY !== 'TEXT') WORDS.shift();
        if (KEY === 'FOOTNOTE') {
          CACHE[u] = PREV_LINE.trim() + PARSER[KEY](WORDS.join(' '))
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

/* output full document as html */
function html_output() {
  const HTML = HTML_COLLECTOR.join('<p />')
  return HTML;
}

function save_html_output(filename) {
  // save html output to file
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(filename, html_output());
}

/* format incomplete items into a markdown list */
// const INCOMPLETE = STATUS.TODO_INCOMPLETE // option --tasks
function md_incomplete() {
  let INCOMPLETE = new Array();
  STATUS.TODO_INCOMPLETE.forEach(item => {
    INCOMPLETE.push(`- [ ] ${item}`)
  })
  const INCOMPLETE_FMT = INCOMPLETE.join('\n')
  return INCOMPLETE_FMT;
}

// save incomplete items as incomplete.md
function save_md_incomplete(filename) {
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(`${filename}_incomplete.md`, md_incomplete())
}

/* format done items into markdown list */
// const DONE = STATUS.TODO_DONE // option --completed
function md_done() {
  let DONE = new Array();
  STATUS.TODO_DONE.forEach(item => {
    DONE.push(`- [x] ${item}`)
  })
  const DONE_FMT = DONE.join('\n')
  return DONE_FMT;
}

// save done items as done.md
function save_md_done(filename) {
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(`${filename}_done.md`, md_done())
}

// option --all-tasks => incomplete + done
function md_all_tasks() {
  let alltasks = `${md_incomplete()}\n${md_done()}`
  return alltasks;
}

// save incomplete items as todo.md
function save_all_tasks(filename) {
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(`${filename}_all_tasks.md`, md_all_tasks())
}

function output_ast(filename) {
  if (!filename) filename = `${INPUT_META.stripped}.json`;
  fs.writeFileSync(`${filename}`, [AST_COLLECTOR])
}

// parse arguments. eventually use a library for this, but 
// dependency-free is strongly preferred. 
switch (ARGUMENT) {
  case "html":
    if (OUTPUT) {
      save_html_output(OUTPUT);
      return;
    }
    print(html_output());
    break;
  case "incomplete":
    if (OUTPUT) {
      save_md_incomplete(OUTPUT);
      return;
    }
    print(md_incomplete());
    break;
  case "done":
    if (OUTPUT) {
      save_md_done(OUTPUT);
      return;
    }
    print(md_done());
    break;
  case "alltasks":
    if (OUTPUT) {
      save_all_tasks(OUTPUT);
      return;
    }
    print(md_all_tasks());
    break;
  case "ast":
    print(AST_COLLECTOR)
    break;
  default:
    usage();
    break;
}
