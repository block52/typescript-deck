# Why We Built Our Own Deck

Building a poker platform sounds like it should start with the fun parts: hands, betting, showdowns. Instead, we got stuck on something embarrassingly small — the deck itself.

We assumed npm would have us covered. It didn't. Every existing TypeScript deck library we evaluated shuffled with `Math.random()`, usually wrapped in `lodash.shuffle` or a hand-rolled Fisher-Yates. The problem isn't the algorithm — Fisher-Yates is fine. The problem is the entropy source. V8's `Math.random()` uses xorshift128+ with 128 bits of internal state. A 52-card deck has 52! ≈ 2^225.6 permutations. You cannot map a 128-bit PRNG state onto a 226-bit output space — the vast majority of shuffles are mathematically unreachable. For a casual game, irrelevant. For real-money poker, indefensible.

The other gaps compounded it. Some libraries hadn't been touched since TypeScript 3.8. Some pulled in lodash for twenty lines of swap logic. None exposed a verifiable hash of the deck or seed, so there was no path to a commit-reveal scheme: hash the seed, publish the hash before the hand, reveal the seed after, let any player recompute the shuffle.

So we wrote `@block52/deck`. TypeScript 5.3, zero runtime dependencies, Node's `crypto.randomInt` driving Fisher-Yates, SHA256 on both deck state and seed array. Deterministic when seeded, auditable after the fact, reproducible from a serialized string.

Small library. But it's the part of the stack that has to be trustworthy before anything above it matters.
