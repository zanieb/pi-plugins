---
description:
  Idiomatic Rust conventions and patterns. Use this when writing, reviewing, or
  refactoring Rust code.
---

# Idiomatic Rust Cheat-Sheet

> Distilled from the [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
> and [Rust Design Patterns — Idioms](https://rust-unofficial.github.io/patterns/idioms/).

When writing Rust code, follow these rules ordered by priority:

- ALWAYS isolate `unsafe` code into the smallest possible module with a safe public API — audit surface area shrinks dramatically
- ALWAYS validate function arguments — prefer static enforcement via newtypes (compile-time, zero cost) > dynamic enforcement via `Result` > `debug_assert!` > `_unchecked` unsafe opt-outs
- PREFER providing `_unchecked` unsafe sibling functions for hot paths where validation is too expensive and the caller can guarantee validity
- ALWAYS make error types meaningful: implement `std::error::Error`, `Display`, and `Debug`; never use `()` as an error type; prefer `Error + Send + Sync + 'static` bounds
- ALWAYS make error `Display` messages lowercase, without trailing punctuation, and concise (e.g., `"unexpected end of file"`, `"invalid IP address syntax"`)
- NEVER implement `Error::description()` — it is deprecated; use `Display` instead
- ALWAYS make types `Send` and `Sync` where possible — avoid unnecessary `Rc`, interior `Cell`, or raw pointers that would break thread safety
- ALWAYS write regression tests for `Send` and `Sync` on types that should be thread-safe: `fn assert_send<T: Send>() {}; assert_send::<MyType>();`
- NEVER panic in destructors (`Drop::drop`) — a panic during unwinding aborts the process; instead, provide a separate `close()` method that returns `Result`
- ALWAYS use `snake_case` for functions, methods, variables, and modules; `PascalCase` for types, traits, and enum variants; `SCREAMING_SNAKE_CASE` for constants and statics (RFC 430)
- ALWAYS treat acronyms as single words in `UpperCamelCase`: `Uuid` not `UUID`, `Usize` not `USize`, `Stdin` not `StdIn`; in `snake_case` lowercase them: `is_xid_start`
- AVOID single-letter "words" in `snake_case` except as the last word — write `btree_map` not `b_tree_map`, but `PI_2` is fine
- ALWAYS derive or implement `Debug` on every type — for types containing `dyn Trait`, write a manual `impl Debug`
- NEVER produce an empty `Debug` representation — always emit at least the type name
- ALWAYS implement or `#[derive(Default)]` when a sensible zero/empty value exists — this unlocks `unwrap_or_default()`, struct-update syntax, and generic containers
- ALWAYS provide a `new()` associated function as the primary constructor; implement both `new()` and `Default` when both make sense, and ensure they have the same behavior
- PREFER `_with_foo` suffixed constructors for secondary constructors; for many options, use the builder pattern instead
- PREFER `From`, `TryFrom`, `AsRef`, and `AsMut` for conversions instead of ad-hoc `from_x()` methods — this unlocks the blanket `Into` impl for free
- NEVER implement `Into` or `TryInto` directly — they have blanket impls from `From`/`TryFrom`; always implement `From`/`TryFrom` instead
- PREFER `&str` over `&String`, `&[T]` over `&Vec<T>`, and `&T` over `&Box<T>` in function arguments — this avoids double indirection and accepts more input types via deref coercion
- PREFER letting the caller decide where data is copied — accept ownership when the function needs it, borrow when it doesn't; never borrow-then-clone internally when you could just accept an owned value
- PREFER generics over concrete types in function parameters to widen the set of accepted inputs (e.g., `impl IntoIterator<Item = i64>` instead of `&[i64]`, `impl AsRef<Path>` instead of `&Path`) — this gives static dispatch, inline layout, and type inference
- PREFER newtypes to provide static distinctions between otherwise-identical types (e.g., `Miles(f64)` vs. `Kilometers(f64)`) — zero-cost at runtime; use single-field tuple structs to provide a new identity, restrict an API, or implement foreign traits
- PREFER dedicated enum variants or structs over `bool` / `Option` arguments when the meaning of each value isn't obvious at the call site
- PREFER the builder pattern for constructing complex values with many optional fields — return `&mut Self` from each setter for chaining
- PREFER `&mut self`-returning setters when the terminal method (`.build()`) only borrows; prefer consuming `self` setters when the terminal method needs ownership
- PREFER returning consumed arguments inside the error variant when a fallible function takes ownership — e.g., `Err(SendError(value))` — so the caller can retry without cloning
- PREFER `Drop` impls as the Rust equivalent of `finally` blocks — destructors run on normal return, early `?` return, and panic unwind
- PREFER guard objects that lock a resource in the constructor and release it in `Drop` — the borrow checker guarantees the guard (and thus the lock) outlives any references it hands out
- ALWAYS assign the guard/finaliser to a named variable (e.g., `let _guard = ...`); assigning to bare `_` drops it immediately
- PREFER `mem::take(field)` to move an owned value out of a `&mut` reference without cloning — it swaps in `Default::default()` and hands you the original
- PREFER `mem::replace(field, new_value)` when the type does not implement `Default`
- AVOID `.clone()` just to satisfy the borrow checker — restructure borrows, use `mem::take`, or split the struct instead
- PREFER splitting a large struct into smaller sub-structs when methods need mutable access to disjoint fields simultaneously — the borrow checker cannot split borrows across a single struct
- PREFER methods over free functions when there is a clear receiver — methods auto-borrow, need no imports, support `self` notation, and show up in "what can I do with `T`" docs
- AVOID out-parameters — return the value instead; the exception is buffer-reuse patterns like `fn read(&mut self, buf: &mut [u8]) -> io::Result<usize>`
- ALWAYS keep operator overloads unsurprising — only implement `Mul` for things that genuinely resemble multiplication (associative, etc.)
- PREFER the `as_` / `to_` / `into_` prefix convention for conversions — `as_` for cheap ref-to-ref views, `to_` for expensive borrowed→owned, `into_` for owned→owned consuming self
- PREFER `to_`/`as_`/`into_` over `from_` when in doubt — they are more ergonomic and chainable
- PREFER `as_mut_slice` over `as_slice_mut` — when `mut` is part of the return type, place it where it would appear in the type itself
- PREFER `into_inner()` to unwrap a value from a wrapper type (buffered I/O, atomics, encoders)
- AVOID the `get_` prefix on getters — name the getter after the field (e.g., `fn first(&self) -> &First`, not `fn get_first`)
- ALWAYS name iterator-producing methods `iter()`, `iter_mut()`, and `into_iter()` and give iterator types names that match the method (e.g., `struct IntoIter`)
- PREFER verb-object-error word order for error type names (e.g., `ParseAddrError`, not `AddrParseError`)
- PREFER `format!("Hello {name}!")` to manually pushing onto a `String` — more readable, though slightly less efficient than pre-allocated `push_str` chains
- ONLY implement `Deref` / `DerefMut` on actual smart pointers, never as a poor-man's inheritance mechanism — it breaks caller expectations and confuses method resolution
- PREFER `let x: &mut dyn Trait = if cond { &mut a } else { &mut b }` over `Box<dyn Trait>` when you only need dynamic dispatch within a single scope — avoids a heap allocation
- PREFER `.extend(option)`, `.chain(option.iter())`, and `for x in option` when treating an `Option` as a zero-or-one-element iterator — more composable than `if let`
- PREFER scoped variable rebinding to control what a closure captures — clone or borrow in a block before the `move ||` to capture exactly what you intend
- PREFER rebinding a mutable variable as immutable after setup is complete — either via a nested block (`let data = { let mut d = get(); d.sort(); d };`) or re-`let` (`let data = data;`)
- PREFER `bitflags!` over enums when modelling a set of combinable flags
- PREFER generic `R: Read` / `W: Write` parameters taken **by value** (not by reference) for reader/writer functions — a `&mut R` is itself `Read`, so callers can still pass references
- ALWAYS use `?` in doc examples, not `try!` or `.unwrap()` — teach callers good error handling; use hidden `fn main() -> Result<...>` wrappers to enable `?`
- ALWAYS document error conditions (`# Errors`), panic conditions (`# Panics`), and safety invariants (`# Safety`) on the relevant functions and trait methods
- ALWAYS hyperlink related types, traits, and methods in doc prose with intra-doc links — follow RFC 1574: "link all the things"
