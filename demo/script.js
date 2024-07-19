function reset() {
  document.getElementById("content").innerHTML = "";
  document.getElementById("result").innerHTML = "";
}

function placeholder() {
  let text = [
    "# Hello",
    "% This is a comment about something",
    "This is a sample of some todo markup. This markup only has eight operators, and is a replacement for markdown for todo-focused notes -- each operator represents an action.",
    "You cand find more information about the syntax at ^https://github.com/unforswearing/todo_markup.js",
    "Notes like this and the lines above are grouped on the backend. You can view these notes in the generated markup by clicking the 'notes' button",
    "= Some tasks",
    "! this task is incomplete!<br/>x this task is done",
    "= Tasks for a specific project",
    "! this project task is incomplete!<br/>! Another incomplete task!<br/>x This task is done though",
    "= More details",
    "Urls exist inline with text like ^https://example.com. Bare urls can live on their own line without the caret markup",
    "https://example.com/bare-url.html",
    "There is no emphasis or italics, but you can highlight text in yellow.",
    "> Highlights must live on their own line, unfortunately.",
    "> Another highlighted line, just for fun",
    "% This is another comment that will be removed from the HTML output",
    "This markup also has footnotes",
    "@ But footnotes must live on a new line, just like highlights.",
    "All done!",
  ];

  document.getElementById("content").innerHTML = text.join("<p></p>");
}

function todomarkup(ARGUMENT) {
  const result = document.getElementById("result");

  // accept a single argument for now. accept mutliple args later...
  // node todo_markup.js todo.tdx html out.html
  // usage: todo_markup.js INPUT ARGUMENT OUTPUT
  const INPUT = document.getElementById("content").innerText;

  // separate INPUT file into INPUT_LINES
  const INPUT_LINES = INPUT.split("\n");

  // separate INPUT_LINES into an array of words
  let words_tmp = new Array();
  for (let v = 0; v < INPUT_LINES.length; v++) {
    words_tmp.push(INPUT_LINES[v].split("W"));
  }

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
  const fullURL =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

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
    let unitWords = unit.split(" ");
    for (let g = 0; g < unitWords.length; g++) {
      if (unitWords[g] && unitWords[g].match(fullURL)) {
        let matched = unitWords[g].split("");
        if (matched[0] == "^") matched.shift();
        unitWords[g] = PARSER.URL(matched.join(""));
      }
    }
    return unitWords.join(" ");
  };

  // using the empty string directly does not work
  const emptyString = " ".trim();

  // PARSER functions
  function NEWLINE(unit) {
    return unit;
  }
  function URL(unit) {
    if (!unit) return unit;
    META.push({ URL: unit });
    return `<a href="${unit}">${unit}</a>`;
  }
  function TEXT(unit) {
    if (!unit) return "<br />";
    META.push({ TEXT: unit });
    return parseURL(unit);
  }
  function COMMENT(unit) {
    META.push({ COMMENT: unit });
    return emptyString;
  }
  function HEADER(unit) {
    if (!unit) return;
    META.push({ HEADER: unit });
    return `<h1>${parseURL(unit)}</h1>`;
  }
  function SUBHEAD(unit) {
    if (!unit) return;
    META.push({ SUBHEAD: unit });
    return `<h2>${parseURL(unit)}</h2>`;
  }
  function TODO_INCOMPLETE(unit) {
    if (!unit) return;
    META.push({ TODO_INCOMPLETE: unit });
    return `<input type="checkbox"> ${parseURL(unit)}</input>`;
  }
  function TODO_DONE(unit) {
    if (!unit) return;
    META.push({ TODO_DONE: unit });
    let timestamp = new Date().toString().substring(0, 21);
    return `
    <del>
    <input type="checkbox" checked>${parseURL(unit)}</input>
    </del>&nbsp;<code>${timestamp}</code>`;
  }
  function HIGHLIGHT(unit) {
    META.push({ HIGHLIGHT: unit });
    if (!unit) return;
    return `<mark>${parseURL(unit)}</mark>`;
  }
  let fnTally = 0;
  function FOOTNOTE(unit) {
    if (!unit) return;
    META.push({ FOOTNOTE: unit });
    unit = parseURL(unit);
    let fnTemplate = `<span id="fn-${fnTally}">
    [<a href="#fnsrc-${fnTally}">${fnTally}</a>]: ${unit}
  </span>`;
    FOOTNOTES.push(fnTemplate);
    let footnoteHref = `<span style="font-size:0.5em">
    <a style="vertical-align:50%;display:inline-block;line-height:15px" id="fnsrc-${fnTally}" href="#fn-${fnTally}">${fnTally}</a>
    </span>`;
    fnTally++;
    return footnoteHref;
  }

  // create PARSER object to contain PARSER functions
  const PARSER = {
    TEXT: TEXT,
    COMMENT: COMMENT,
    FOOTNOTE: FOOTNOTE,
    HEADER: HEADER,
    SUBHEAD: SUBHEAD,
    TODO_INCOMPLETE: TODO_INCOMPLETE,
    TODO_DONE: TODO_DONE,
    URL: URL,
    HIGHLIGHT: HIGHLIGHT,
    NEWLINE: NEWLINE,
  };

  // read each item in INPUT_LINES collected from INPUT file
  // run PARSER to find GRAMMAR matches. when found add GRAMMAR item
  // to META, AST_COLLECTOR, FOOTNOTES, CACHE, and STATUS arrays.
  // inputLoop:
  for (let n = 0; n < INPUT_LINES.length; n++) {
    let u = n === 0 ? n : n - 2;
    let LINE = INPUT_LINES[n];
    let PREV_LINE = INPUT_LINES[u];
    let WORDS = LINE.split(" ");
    wordsLoop: for (let q = 0; q < WORDS.length; q++) {
      if (WORDS[q].match(GRAMMAR.URL)) WORDS[q] = PARSER.URL(WORDS[q]);
      let word = WORDS[0];
      // grammarLoop:
      for (let r = 0; r < GRAMMAR_KEYS.length; r++) {
        let KEY = GRAMMAR_KEYS[r];
        AST_COLLECTOR[n] = {
          key: KEY,
          regex: GRAMMAR[KEY],
          line: LINE.trimEnd(),
          url: LINE.match(fullURL) ? LINE.match(fullURL)[0] : false,
        };
        if (PARSER[KEY] && word.match(GRAMMAR[KEY])) {
          if (KEY !== "TEXT") WORDS.shift();
          if (KEY === "FOOTNOTE") {
            CACHE[u] = PREV_LINE.trim() + PARSER[KEY](WORDS.join(" "));
            break wordsLoop;
          }
          if (KEY === "TODO_INCOMPLETE" || KEY === "TODO_DONE") {
            STATUS[KEY].push(WORDS.join(" "));
          }
          CACHE.push(PARSER[KEY](WORDS.join(" ")));
          break wordsLoop;
        }
      }
    }
  }

  // create footnotes section for html output
  if (FOOTNOTES.length > 0) {
    CACHE.push("<hr />");
    CACHE.push("<details><summary>Footnotes</summary>");
    CACHE.push(FOOTNOTES.join("<br />"));
    CACHE.push("</details>");
  }
  // loop over each footnote in CACHE, adding to the HTML_COLLECTOR
  let HTML_COLLECTOR = new Array();

  for (let entry = 0; entry < CACHE.length; entry++) {
    if (CACHE[entry] !== "\n") HTML_COLLECTOR.push(CACHE[entry]);
  }

  const HAS_HTML = HTML_COLLECTOR.join("");

  /* output full document as html */
  function html_output() {
    if (!HAS_HTML) {
      let msg = `<strong>No markup found.</strong> Click the 'example' button 
        or enter ToDo markup to get started.`;
      return msg;
    }
    const HTML = HTML_COLLECTOR.join("<p />");
    return HTML;
  }

  /* format incomplete items into a markdown list */
  // const INCOMPLETE = STATUS.TODO_INCOMPLETE // option --tasks
  function md_incomplete() {
    let INCOMPLETE = new Array();
    STATUS.TODO_INCOMPLETE.forEach((item) => {
      INCOMPLETE.push(`- [ ] ${item}`);
    });
    const INCOMPLETE_FMT = INCOMPLETE.join("\n");
    return INCOMPLETE_FMT;
  }

  /* format done items into markdown list */
  // const DONE = STATUS.TODO_DONE // option --completed
  function md_done() {
    let DONE = new Array();
    STATUS.TODO_DONE.forEach((item) => {
      DONE.push(`- [x] ${item}`);
    });
    const DONE_FMT = DONE.join("\n");
    return DONE_FMT;
  }

  // option --all-tasks => incomplete + done
  function md_all_tasks() {
    let alltasks = `${md_incomplete()}\n${md_done()}`;
    return alltasks;
  }

  // print the TEXT matches to the console
  function output_text() {
    let text = [];
    META.forEach((item) => {
      if (item.TEXT) text.push(item.TEXT);
    });
    return text.join("\n\n");
  }

  // print COMMENT matches to console
  function output_comments() {
    let comments = [];
    META.forEach((item) => {
      if (item.COMMENT) comments.push(item.COMMENT);
    });
    return comments.join("\n\n");
  }

  // print URL matches to console
  function output_urls() {
    let urls = [];
    META.forEach((item) => {
      if (item.URL) urls.push(item.URL);
    });
    return urls.join("\n");
  }

  // print HIGHLIGHT matches to console
  function output_highlight() {
    let highlights = [];
    META.forEach((item) => {
      if (item.HIGHLIGHT) highlights.push(item.HIGHLIGHT);
    });
    return highlights.join("\n");
  }

  // print ast to console
  function output_ast() {
    return JSON.stringify([AST_COLLECTOR], null, 4);
  }

  // parse arguments. eventually use a library for this, but
  // dependency-free is strongly preferred.
  switch (ARGUMENT) {
    case "html":
      result.innerHTML = html_output();
      break;
    case "incomplete":
      result.innerText = md_incomplete();
      break;
    case "done":
      result.innerText = md_done();
      break;
    case "alltasks":
      result.innerText = md_all_tasks();
      break;
    case "notes":
      result.innerText = output_text();
      break;
    case "comments":
      result.innerText = output_comments();
      break;
    case "urls":
      result.innerText = output_urls();
      break;
    case "highlight":
      result.innerText = output_highlight();
      break;
    case "ast":
      result.innerText = output_ast();
      break;
    default:
      usage();
      break;
  }

  // window.location.href = `${window.location.href}#result_header`;
}
