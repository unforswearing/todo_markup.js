const fs = require('fs');
const path = require('path');
// const { Command } = require('commander');

/*
todo_markup.js -- simplified markup for todo-focused notes

usage:
  todo_markup.js notesfile.tdx <option> [outputfile]
  eg. todo_markup.js notesfile.tdx compiled_notes.html

options:
    ast "file.md"
    incomplete "file.md"
    done "file.md"
    alltasks "file.md"
    notes "file.md"
    comments "file.md"
    urls "file.md"
*//*
@todo look into using commander for option parsing - https://www.npmjs.com/package/commander
@todo option to convert tdx file to markdown instead of html
*/

// internal: shorthand for console.log
const print = (str) => console.log(str);
// script usage for command line
const usage = () => {
  let usagetext = `
todo_markup.js -- simplified markup for todo-focused notes

usage:
  todo_markup.js notesfile.tdx <option> [outputfile]
  eg. todo_markup.js notesfile.tdx compiled_notes.html

options:
  incomplete "file.md"
  done "file.md"
  alltasks "file.md"
  notes
  comments
  urls
  ast "file.md"
`;
  print(usagetext);
};

// accept a single argument for now. accept mutliple args later...
// node todo_markup.js todo.tdx html out.html
// usage: todo_markup.js INPUT ARGUMENT OUTPUT
const INPUT = process.argv[2];
const ARGUMENT = process.argv[3];
const OUTPUT = process.argv[4];

// catch the help command if it is passed as INPUT
if (INPUT === "help") {
  usage();
  return;
};

// read the INPUT file, separate INPUT file into INPUT_LINES
const INPUT_FILE = fs.readFileSync(INPUT, 'utf8');
const INPUT_LINES = INPUT_FILE.split('\n');

// parts of the INPUT file to generate OUTPUT filenames
const FILE_META = {
  fullName: path.parse(process.argv[2]).base,
  stripped: path.parse(process.argv[2]).name,
  extension: path.parse(process.argv[2]).ext
};

// separate INPUT_LINES into an array of words
let words_tmp = new Array();
for (let v = 0; v < INPUT_LINES.length; v++) {
  words_tmp.push(INPUT_LINES[v].split('\W'));
};

// GRAMMAR === operators
// each item should start the line -- no nested todo grammar.
// formatting will only apply to the first item found by the parser
// regex in GRAMMAR only matches operator, not full line
const GRAMMAR = {
  HEADER: /^\#/,
  SUBHEAD: /^\=/,
  TODO_INCOMPLETE: /^\!/,
  TODO_DONE: /^x/,
  COMMENT: /^%/,
  FOOTNOTE: /^\@/,
  URL: /\^/,
  HIGHLIGHT: /^>/,
  LANG_OPERATORS: /(^x|^\@|^>|^\!|^\#|^\%|^\=|\^|\+)/,
  TEXT: /(?!${this.LANG_OPERATORS})([aA-zZ0-9]+|\s+|'|"|\.)/,
  NEWLINE: /(\n+|^.*$)/,
};

const GRAMMAR_KEYS = Object.keys(GRAMMAR);

// from the internet somewhere... need source
const fullURL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

// arrays to collect information about the INPUT file
let META = new Array();
let FOOTNOTES = new Array();
let CACHE = new Array();
let STATUS = {
  TODO_INCOMPLETE: new Array(),
  TODO_DONE: new Array(),
};
let AST_COLLECTOR = {};
// parseURL removes the caret char '^' from the start of urls
const parseURL = (unit) => {
  let unitWords = unit.split(' ');
  for (let g = 0; g < unitWords.length; g++) {
    if (unitWords[g] && unitWords[g].match(fullURL)) {
      let matched = unitWords[g].split('');
      if (matched[0] == "^") matched.shift();
      unitWords[g] = PARSER.URL(matched.join(''));
    }
  }
  return unitWords.join(' ');
};

// using the empty string directly does not work
const emptyString = ' '.trim();

// PARSER functions
function NEWLINE(unit) { return unit; };
function URL(unit) {
  if (!unit) return unit;
  META.push({ 'URL': unit });
  return `<a href="${unit}">${unit}</a>`;
};
function TEXT(unit) {
  if (!unit) return '<br />';
  META.push({ 'TEXT': unit });
  return parseURL(unit);
};
function COMMENT(unit) {
  META.push({ 'COMMENT': unit });
  return emptyString;
};
function HEADER(unit) {
  if (!unit) return;
  META.push({ 'HEADER': unit });
  return `<h1>${parseURL(unit)}</h1>`;
};
function SUBHEAD(unit) {
  if (!unit) return;
  META.push({ 'SUBHEAD': unit });
  return `<h2>${parseURL(unit)}</h2>`;
};
function TODO_INCOMPLETE(unit) {
  if (!unit) return;
  META.push({ 'TODO_INCOMPLETE': unit });
  return `<input type="checkbox"> ${parseURL(unit)}</input>`;
};
function TODO_DONE(unit) {
  if (!unit) return;
  META.push({ 'TODO_DONE': unit });
  let timestamp = new Date().toString().substring(0, 21);
  return `
  <del>
  <input type="checkbox" checked>${parseURL(unit)}</input>
  </del>&nbsp;<code>${timestamp}</code>`;
};
function HIGHLIGHT(unit) {
  META.push({ 'HIGHLIGHT': unit });
  if (!unit) return;
  return `<mark>${parseURL(unit)}</mark>`;
};
let fnTally = 0;
function FOOTNOTE(unit) {
  if (!unit) return;
  META.push({ 'FOOTNOTE': unit });
  unit = parseURL(unit);
  let fnTemplate = `<span id="fn-${fnTally}">
	<small>[<a href="#fnsrc-${fnTally}">${fnTally}</a>]: ${unit}</small>
</span>`;
  FOOTNOTES.push(fnTemplate);
  let footnoteHref = `<a id="fnsrc-${fnTally}" href="#fn-${fnTally}"><sup>${fnTally}</sup></a>`;
  fnTally++;
  return footnoteHref;
};

// create PARSER object to contain PARSER functions
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

// read each item in INPUT_LINES collected from INPUT file
// run PARSER to find GRAMMAR matches. when found add GRAMMAR item
// to META, AST_COLLECTOR, FOOTNOTES, CACHE, and STATUS arrays.
// inputLoop:
for (let n = 0; n < INPUT_LINES.length; n++) {
  let u = n === 0 ? n : n - 2;
  let LINE = INPUT_LINES[n];
  let PREV_LINE = INPUT_LINES[u];
  let WORDS = LINE.split(' ');
  wordsLoop:
  for (let q = 0; q < WORDS.length; q++) {
    if (WORDS[q].match(GRAMMAR.URL)) WORDS[q] = PARSER.URL(WORDS[q]);
    let word = WORDS[0];
    // grammarLoop:
    for (let r = 0; r < GRAMMAR_KEYS.length; r++) {
      let KEY = GRAMMAR_KEYS[r];
      AST_COLLECTOR[n] = {
        key: KEY,
        regex: GRAMMAR[KEY],
        line: LINE.trimEnd(),
        url: LINE.match(fullURL) ? LINE.match(fullURL)[0] : false
      }
      if (PARSER[KEY] && word.match(GRAMMAR[KEY])) {
        if (KEY !== 'TEXT') WORDS.shift();
        if (KEY === 'FOOTNOTE') {
          CACHE[u] = PREV_LINE.trim() + PARSER[KEY](WORDS.join(' '));
          break wordsLoop;
        }
        if ((KEY === 'TODO_INCOMPLETE') || (KEY === 'TODO_DONE')) {
          STATUS[KEY].push(WORDS.join(' '));
        }
        CACHE.push(PARSER[KEY](WORDS.join(' ')));
        break wordsLoop;
      }
    }
  }
}

// create footnotes section for html output
CACHE.push('<hr />');
CACHE.push('<details><summary>Footnotes</summary>');
CACHE.push(FOOTNOTES.join('<br />'));
CACHE.push('</details>');

// loop over each footnote in CACHE, adding to the HTML_COLLECTOR
let HTML_COLLECTOR = new Array();

for (let entry = 0; entry < CACHE.length; entry++) {
  if (CACHE[entry] !== "\n") HTML_COLLECTOR.push(CACHE[entry]);
}

/* output full document as html */
function html_output() {
  const HTML = HTML_COLLECTOR.join('<p />');
  return HTML;
}

// save html output to file
function save_html_output(filename) {
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(filename, html_output());
}

/* format incomplete items into a markdown list */
// const INCOMPLETE = STATUS.TODO_INCOMPLETE // option --tasks
function md_incomplete() {
  let INCOMPLETE = new Array();
  STATUS.TODO_INCOMPLETE.forEach(item => {
    INCOMPLETE.push(`- [ ] ${item}`)
  });
  const INCOMPLETE_FMT = INCOMPLETE.join('\n');
  return INCOMPLETE_FMT;
}

// save incomplete items as incomplete.md
function save_md_incomplete(filename) {
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(`${filename}_incomplete.md`, md_incomplete());
};

/* format done items into markdown list */
// const DONE = STATUS.TODO_DONE // option --completed
function md_done() {
  let DONE = new Array();
  STATUS.TODO_DONE.forEach(item => {
    DONE.push(`- [x] ${item}`);
  })
  const DONE_FMT = DONE.join('\n');
  return DONE_FMT;
}

// save done items as done.md
function save_md_done(filename) {
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(`${filename}_done.md`, md_done());
};

// option --all-tasks => incomplete + done
function md_all_tasks() {
  let alltasks = `${md_incomplete()}\n${md_done()}`;
  return alltasks;
}

// save incomplete items as todo.md
function save_all_tasks(filename) {
  if (!filename) filename = FILE_META.stripped;
  fs.writeFileSync(`${filename}_all_tasks.md`, md_all_tasks());
};

// print the TEXT matches to the console
function output_text() {
  META.forEach(item => { item.TEXT && print(item.TEXT) });
}

// print COMMENT matches to console
function output_comments() {
  META.forEach(item => { item.COMMENTS && print(item.COMMENTS) });
}

// print URL matches to console
function output_urls() {
  META.forEach(item => { item.URL && print(item.URL) });
}

// print HIGHLIGHT matches to console
function output_highlight() {
  META.forEach(item => { item.HIGHLIGHT && print(item.HIGHLIGHT) });
}

// print ast to console
function output_ast() {
  return [AST_COLLECTOR];
}

// save the ast to a file named `filename`
function save_ast(filename) {
  if (!filename) filename = `${FILE_META.stripped}.json`;
  fs.writeFileSync(`${filename}`, AST_COLLECTOR);
};

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
  case "notes":
    print(output_text());
    break;
  case "comments":
    print(output_comments());
    break;
  case "urls":
    print(output_urls());
    break;
  case "highlight":
    print(output_highlight());
    break;
  case "ast":
    if (OUTPUT) {
      save_ast(OUTPUT);
      return;
    }
    print(output_ast());
    break;
  default:
    usage();
    break;
}
