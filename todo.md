# todo.tdx test file

## General Information

regular notes look like this. they will be marked as \"TEXT\" by the
parser. this note can be one long line or a series of individual lines.
the point is that notes do not have a special operator preceeding the
text like the other formatting options.

todo_markup.js is for taking notes quickly during meetings or
conferences, when there is only time to open a txt file or Google Doc
(instead of juggling multiple apps). to keep things simple
todo_markup.js does not have nested tasks, reminders, or calendar
integration.

## Task States

two task \"states\" instead of three: active an done. any line of text
could become a todo item by prepending ! or x

a few sample tasks:

let georgia know that i will be late on monday

[an exclamation mark \"!\" prepended to the task indicates the task is
in progress.]{.mark}

talk to steve about <https://www.example.com>

[tasks can include urls, which are indicated using the caret operator.
urls can be placed anywhere in the line. ]{.mark}

don\'t forget steve\'s birthday!

completed tasks are indicated with an \"x\". these tasks are done:

~~let melissa borrow the company credit card~~  `Wed May 10 2023 12:41`

~~bring ice to the work bbq~~  `Wed May 10 2023 12:41`

## Additional Markup

notes can have footnotes. the footnote will appear as a sequential
number at the end of the line.[^0^](#fn-0){#fnsrc-0}

notes can also contain highlights which compile to the \"mark\" tag.

[this will be highlighted in yellow. use this for visual emphasis in
lieu of strong or italicized text. ]{.mark}

as seen above, urls can be linked using the \"\^\" operator, eg.
<http://google.com.>

everything else is considered \"TEXT\" and is not processed.

Done. This is the final note in the documentation.

------------------------------------------------------------------------

Footnotes

[ [\[[0](#fnsrc-0)\]: compiled footnotes are moved to a \"details\"
block at the end of the file.]{.small} ]{#fn-0}
