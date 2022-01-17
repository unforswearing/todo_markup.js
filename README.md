# todo_markup.js

> A simple todo-focused markup for textual notes

todo_markup.js is a terse replacement for markdown. The goal of this markup is allow me to manage my notes alongside tasks while giving me the ability to share current progress in asimple format (compiled HTML). 

Fair warning - I am a language nerd / self-taught programmer and this is an experiment. I have read very little about compiler design, choosing to "just wing-it" instead. Use with caution.

**Features**

- Very simple syntax - 8 operators
- Easy to remember, fast to type
- Compiles to HTML by default
- Optionally generate an AST-like json object

## Grammar

The syntax for todo_markup.js must adhere to the following rules:

- All operators must be placed at the beginning of the line
- Operators must be followed by a single space
- Only one operator can be placed on a single line

> Links are the only exception to these rules. See the Links section below

**Heading**

Top level headings are the same as markdown

```
# Here is a Document Title

```

**Sub-Heading**

Sub-headings can be used to separate projects.


```
= Example Project Name

```

**Incomplete Todo**

Incomplete Todo items are prepended with an exclamation point.

> Note: todo_markup.js does not have an operator for pending or backlog type tasks to keep focused on current work. 

```
! This is an item that needs to be done

```

**Completed Todo**

Completed Todos are indicated with an x.

```
x This item is complete!

```

**Comments**

Comments are marked with a percent sign %. All comments are removed from the compiled file. 


```
% This is a comment about the current task, or anything else

```

**Footnotes**

Footnotes are indicated using the @ operator. Footnotes are collected at the bottom of the complied file. The footnote text is replaced with "See Footnote [num]" with a link leading to the footnote at the bottom of the file. 


```
These are normal notes. A footnote will be added to the next line.

@ Footnotes are displayed within a details tag.

```

Compiled file produces the following HTML formatted text by default:


See Footnote [<a id="src" href="#fnex">0</a>]

<details>
<summary>Footnotes</sumary>
[<a href="#src" id="fnex">0</a>]: Footnotes are displayed within a details tag.
</details>


**Urls**

Bare urls can be linked using the carrot operator (^). Urls may appear in any other line regardless of other syntax on that line. 

```
It is important to check the file located at ^https://fileserver.com/important.txt for future updates.

```

**Callouts**

Callouts are used to highlight a specific line of text that is particularly important. Currently the callout is the only available text formatting option. Compiled callouts use the "mark" tag.

```
> Please note: Callouts use the default yellow color supported by <mark>

```


**Text and New Lines**

Regular text is returned from the compiler as-is.

The compiler tracks new lines to maintain the structure of the file when producing the AST-like json file. 

## Future

- Move footnotes to sit at the end of the previous line
- Extract only tex from the file
- Extract only tasks frome the file, organized by state
- Add timestamps to completed tasks
- Maybe more stuff, I dunno
