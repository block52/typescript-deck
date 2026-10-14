# Changelog

## 1.1.0

### Security
- Unseeded `shuffle()` now uses Web Crypto `getRandomValues`. In 1.0.0 it used `Math.random()`, which is not cryptographically secure, despite the README. It throws if Web Crypto is unavailable instead of falling back.
- The unseeded shuffle is now unbiased. Each swap index is drawn uniformly by rejection sampling; 1.0.0 reduced random values `% (i + 1)`.

### Fixed
- `deal(n)` skipped `n` cards before dealing, so it returned the wrong cards and left the deck out of position. It now deals the next `n` cards, and throws if fewer are left.
- `shuffle()` resets the deal position to the top of the deck.
- `fromString` reads `T` for ten and either suit case, and normalises the mnemonic (`"th"` → `"10H"`).

### Added
- `toMnemonics({ tens, suitCase })` and `Deck.formatCard`, which export cards in other engines' notation (e.g. `As`, `Td`).
- `randomBelow` (unbiased secure random integer) and `sha256Hex` are exported.

### Changed
- No more imports from Node: the package ships its own SHA-256, so it runs in browsers and edge runtimes too. It needs Node 20+ (global Web Crypto).
- Unchanged: seeded shuffles give exactly the 1.0.0 order and `seedHash` for the same seed, and deck `hash` values are the same.
