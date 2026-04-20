# Future additions (out of scope for the v2 rewrite)

Do not implement without explicit go-ahead.

- New single-char constructs if the maintainer later decides they want
  them. Candidates currently unused: `~` (tentative/scratch), `^`
  (refers-back). `&` and `$` explicitly ruled out.
- Light theme refinements based on user feedback after shipping.
- Any form of rendered/preview mode — would break the single-mode
  design constraint and needs that decision re-opened first.
- Nested scope highlighting for URLs and mentions inside strings and
  line-level parens/brackets/braces. Today the outer match is atomic,
  so `"@alice"` highlights as a string only and `(see https://x)`
  highlights as `meta.parens.line.bd` only. VS Code's built-in link
  detector still makes the URL clickable regardless.
