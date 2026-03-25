# Why We Built @block52/deck

When building our poker platform, we evaluated existing npm deck libraries and found significant gaps.

## The Problem with Existing Libraries

| Package | TypeScript | Last Active | Shuffle Method | Issues |
|---------|------------|-------------|----------------|--------|
| [typedeck](https://github.com/mitch-b/typedeck) | 3.8.3 (2020) | ~2017-2020 | `Math.random()` | Old TS, insecure shuffle, uses deprecated TSLint |
| [node-cards](https://github.com/kbjr/node-cards) | 4.3.4 (2021) | Jul 2022 | Customizable RNG | Better, but TS 4.x, no crypto default |
| [deckjs](https://github.com/creativenull/deckjs) | 5.3.3 | Feb 2024 | `lodash.shuffle` (Math.random) | External dep, insecure shuffle |
| card-deck | None (JS) | Old | Unknown | Plain JavaScript, no types |

## Outdated Tooling

[typedeck](https://github.com/mitch-b/typedeck) runs TypeScript 3.8 (2020) with deprecated TSLint. [node-cards](https://github.com/kbjr/node-cards) uses TS 4.3. We built on TypeScript 5.3 with modern ESM support.

## Insecure Shuffling

Both typedeck and [deckjs](https://github.com/creativenull/deckjs) use `Math.random()` for shuffling—unsuitable for gaming applications requiring provable fairness. As [documented in lodash](https://github.com/lodash/lodash/issues/4743), `Math.random()` lacks sufficient entropy for proper permutation coverage.

## Missing Verifiability

No existing library provides cryptographic hashing for shuffle verification. Our deck generates SHA256 hashes of both deck state and shuffle seeds, enabling commit-reveal schemes essential for trustless gaming.

## Zero Dependencies

While deckjs pulls in lodash for a 20-line algorithm, @block52/deck uses only Node's built-in `crypto` module—no supply chain risk, fully auditable.

## Install

```bash
npm install @block52/deck
```
