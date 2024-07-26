# todo_markup.js

> A minimal todo-focused markup for textual notes

<br />

## Why

I am deeply interested in creating small markup and programming languages for fun. This markup was created for taking notes quickly during meetings or conferences, when there is only time to open a text file or Google Doc (instead of juggling multiple apps).

This markup is currently a replacement for [markdown](https://learnxinyminutes.com/docs/markdown/) however, `todo_markup.js` may eventually become a superset / extension for the markdown specification (likely targeting [commonmark](https://commonmark.org/)).

<br />

## Features

- Syntax is 8 operators
  - `#` Heading
  - `=` Sub-heading
  - `!` Incomplete Todo
  - `x` Completed Todo
  - `%` Comment
  - `@` Footnote
  - `^` Url
  - `>` Highlight
- The todo file is line based -- there is no nested todo grammar aside from URLs.
- Output or save HTML from various options.
- Output complete and / or incomplete tasks as standalone markdown files.
- Generate an AST-like json object.

See [todo.tdx](./todo.tdx) for an example of this markup.

<br />

## To Do / Roadmap

See [Issues](https://github.com/unforswearing/todo_markup.js/issues) for planned features and fixes.

<br />

## Installation

You can use the [demo app](https://www.unforswearing.com/todo_markup/) to test the markup in a live environment.

Clone this repository if you would like to install `todo_markup.js` on your system:

```bash
git clone https://github.com/unforswearing/todo_markup.js.git
cd todo_markup.js

# print the help message
node todo_markup.js help
```

<br />

## Usage

There are currently three options for running `todo_markup.js` against your files:

- Create HTML from a todo file

```bash
# the command below will print html to the console
node todo_markup.js todo.tdx html

# pass a filename to save the output
node todo_markup.js todo.tdx html notes.html
```

- Output incomplete tasks as markdown

```bash
node todo_markup.js todo.tdx incomplete [outputfile]
```

- Output completed tasks as markdown

```bash
node todo_markup.js todo.tdx done [outputfile]
```

- Output all tasks as markdown

```bash
node todo_markup.js todo.tdx alltasks [outputfile]
```

- Print a minimal [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) for todo file

```bash
node todo_markup.js todo.tdx ast
```

Note: `outputfile` is optional for all available commands

<br />

## Grammar

When creating todo files for use with `todo_markup.js` you must adhere to the following rules:

- All operators must be placed at the beginning of the line
- Operators must be followed by a single space
- Only one operator can be placed on a single line

> Links are the only exception to these rules. See the Links section below

<br />

### Heading

Top level headings are the same as markdown

```txt
# Here is a Document Title
```

<br />

### Sub-Heading

Sub-headings can be used to separate projects.

```txt
= Example Project Name
```

<br />

### Incomplete Todo

Incomplete Todo items are prepended with an exclamation point `!`. No need for square brackets `[]`

```txt
! This is an item that needs to be done
```

> Note: todo_markup.js does not have an operator for pending or backlog type tasks to keep focused on current work.

<br />

### Completed Todo

Completed Todos are indicated with an `x` before the todo title.

```txt
x This item is complete!
```

<br />

### Comments

Comments are marked with a percent sign `%`. All comments are removed from the compiled file.

```txt
% This is a comment about the current task, or anything else
```

<br />

### Footnotes

Footnotes are indicated using the 'at' sign '@'. Footnotes are collected at the bottom of the complied file. The footnote text is replaced with `See Footnote [num]` with a link leading to the footnote at the bottom of the file.

```txt
These are normal notes. A footnote will be added to the next line.

@ Footnotes are displayed within a details tag.
```

Compiled file produces the following HTML formatted text by default:

```html
<div style="background-color: f0f0f0">
See Footnote [<a id="fnsrc-0" href="#fn-0">0</a>]

  <details>

    <summary>Footnotes</summary>
    <br />

    [<a id="fn-0" href="#src">0</a>]: Footnotes are displayed within a details tag.

  </details>

</div>
```

<br />

### Urls

Bare urls can be linked using the carrot operator `^`. Urls may appear in any other line regardless of other syntax on that line.

```txt
It is important to check the file located at ^https://fileserver.com/important.txt for future updates.
```

<br />

### Highlight

Highlights are used to add emphasis a specific line of text that is particularly important. Currently the highlight is the only available text formatting option. Compiled highlights use the "mark" tag.

```txt
> Please note: Highlights use the default yellow color
> supported by the HTML `<mark>` tag
```

<br />

### Text / New Lines

Regular text is returned from the compiler as-is.

The compiler tracks new lines to maintain the structure of the file when producing the AST-like json file.

<br />
