<!-- 4aa1b506-19cb-4185-95c3-d6ee8d2ed1ec 990aa27e-178c-448d-9447-a0c904811e65 -->
# Inline Math Keystroke Suggestions (Greek-first)

## Scope

- Trigger suggestions on every keystroke inside the BlockNote editor (content blocks only).
- On Enter/Tab, replace the current word with a new inline node `mathSymbol` that renders immediately (unicode or LaTeX via KaTeX).
- Start with Greek letters; architecture allows you to extend to any symbols/rules.

## Key Files (proposed)

- `app/lib/blocknote-schema.ts`: register new inline content spec `mathSymbol` and a small helper to mount the suggestion plugin.
- `app/components/product components/InlineMathSymbol.tsx`: renderer/editor for `mathSymbol` (renders unicode; optional KaTeX later).
- `app/components/product components/MathSuggestPopover.tsx`: floating suggestions UI (positioned by caret rect).
- `app/lib/math-dsl/suggestions.ts`: export GREEK list and helpers (already exists; extend with glyphs + ranking).
- `app/lib/math-dsl/utils.ts`: caret + word boundary helpers (get current word, replace range, caret rect).

## Data Model

- New inline content spec: `mathSymbol`
- props: `{ token: string; unicode: string; latex?: string }`
- serializes cleanly; round-trips across copy/paste.

## UX/Behavior

- Typing in BlockNote normal text triggers suggestion if current word matches `[a-zA-Z]{1,}`.
- Suggest list shows best matches, top = exact/startsWith; first item preselected.
- Keys: Enter/Tab = accept; Esc = dismiss; ArrowUp/Down = navigate; typing updates list.
- Accept → replace the word range with a `mathSymbol` node; caret placed after the node.
- Suggestion suppressed in code blocks/links, while composing (IME), or when selection isn’t collapsed.

## Rendering

- `mathSymbol` inline render path:
- Default: render `unicode` directly (e.g., `α`).
- Optional: if `latex` set and `katex` available, render KaTeX; fallback to unicode.
- Styling: subtle background on hover only; no border; inherits line height.

## Editor Integration

- Create a `useMathSuggest` hook/provider that attaches:
- keydown/keyup/input listeners to BlockNote editor.
- computes current word from DOM selection → queries `getMathSuggestions(word)` → shows `MathSuggestPopover` beside caret rect.
- on accept: calls `editor.insertInlineContent` replacing text range with `mathSymbol`.

## Performance & Edge Cases

- Debounce 50ms; cap suggestions to 8.
- Skip when selection spans multiple nodes; skip when composing (compositionstart/end).
- RTL safe; use DOMRect from selection for popup.
- Mobile: long-press shows popover (later), desktop first.

## Extensibility (for your future rules)

- `SUGGEST_SOURCES`: array of providers; current provider = `greekProvider`.
- Each provider: `{ id, trigger(word): boolean, suggestions(word): Suggestion[] }`.
- You can add operators, functions, units by adding new providers without touching the hook.

## Minimal Greek Seed

- e.g., `alpha → α`, `beta → β`, `gamma → γ`, ...
- Accept both lowercase/uppercase inputs; list shows symbol + name.

## Accessibility

- Popover: listbox role; options as `role="option"`; aria-activedescendant for highlight; close on Esc/blur.

## Testing

- Unit: word extraction, provider ranking, node insertion.
- Manual: typing `alp` → Enter inserts `α`; Esc dismiss; arrow navigation.

## Rollout

- Feature behind an env flag or prop on editor (`enableMathSuggest`).
- Non-invasive: if disabled, editor behaves exactly as before.

### To-dos

- [ ] Add BlockNote inline content spec `mathSymbol` with props {token, unicode, latex?}
- [ ] Implement `InlineMathSymbol` to render unicode (KaTeX optional) and no-edit display
- [ ] Create `MathSuggestPopover` with keyboard navigation and caret-anchored position
- [ ] Implement `useMathSuggest` to watch keystrokes, compute word, query providers, accept/insert node
- [ ] Add greekProvider using suggestions.ts with name→unicode mapping, ranking
- [ ] Wire hook and popover into BlockNote editor mount (guarded by enableMathSuggest flag)
- [ ] Add unit tests for word range detect, provider results, insertion; manual scenarios