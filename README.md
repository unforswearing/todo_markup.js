# todo_markup.js

> A simple todo-focused markup for textual notes

`todo_markup.js` is for taking notes quickly during meetings or conferences, when there is only time to open a text file or Google Doc (instead of juggling multiple apps). To keep things simple `todo_markup.js` does not have nested tasks, reminders, or calendar integration. 

See [todo.tdx](./todo.tdx) for an example of this markup. To use this script, clone the repo and run the following command: 

```nodejs
node todo_markup.js todo.tdx
```

## Goals

- Manage notes alongside tasks
- Provide the ability to share current progress (currently defaults to HTML output).
- Reduce context switching between apps by storing tasks in the same document as notes.

Fair warning - I am a language nerd / self-taught programmer and this is an experiment for fun. Use with caution.

## Features

- Syntax is only 8 operators
- Output or save HTML by default
- Output tasks as standalone markdown files.
- Output other note elements (notes, urls, highlights, etc) as metadata.

## Todo 

- Generate an AST-like json object
- Output or save full Todo file as Markdown instead of HTML

<br />

## Grammar

The syntax for todo_markup.js must adhere to the following rules:

- All operators must be placed at the beginning of the line
- Operators must be followed by a single space
- Only one operator can be placed on a single line

> Links are the only exception to these rules. See the Links section below

<br />

### Heading

Top level headings are the same as markdown

```markdown
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

```markdown
> Please note: Highlights use the default yellow color 
> supported by the HTML `<mark>` tag
```

<br />

### Text / New Lines

Regular text is returned from the compiler as-is.

The compiler tracks new lines to maintain the structure of the file when producing the AST-like json file. 

<br />
