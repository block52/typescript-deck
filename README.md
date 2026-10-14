# @block52/deck

[![CI](https://github.com/block52/typescript-deck/actions/workflows/ci.yml/badge.svg)](https://github.com/block52/typescript-deck/actions/workflows/ci.yml)

A TypeScript 52-card deck with a cryptographically secure, unbiased, verifiable shuffle, for poker servers, card games and anything that needs a fair deal it can prove.

## Features

- **Secure shuffle.** Unseeded shuffles draw from Web Crypto `getRandomValues`, and never `Math.random`. If it isn't available, the shuffle throws rather than fall back.
- **Unbiased.** Fisher-Yates with each swap index drawn uniformly by rejection sampling, so there's no modulo bias. A chi-square test in the suite checks every card is equally likely in every position.
- **Verifiable.** `seedHash` commits to the shuffle seed and `hash` to the deck order (SHA-256). Publish the commitment before a hand and reveal the seed after, and anyone can replay the shuffle.
- **Deterministic seeding.** The same seed always gives the same order.
- **Interoperable notation.** `toMnemonics({ tens: "T", suitCase: "lower" })` writes the order as `As`, `Td`, … for other engines, and `fromString` reads `10H`, `TH` or `Th`.
- **Portable, no dependencies.** It ships its own SHA-256 and imports nothing from Node, so it runs the same in Node 20+, browsers and edge runtimes.

## Installation

```bash
npm install @block52/deck
```

## Quick Start

```typescript
import { Deck, SUIT } from "@block52/deck";

// Create a new deck
const deck = new Deck();

// Shuffle with random seed
deck.shuffle();

// Draw cards
const card = deck.getNext();
console.log(card.mnemonic); // e.g., "AS" for Ace of Spades

// Deal multiple cards
const hand = deck.deal(5);
```

## API Reference

### `Deck`

#### Constructor

```typescript
new Deck(deckString?: string)
```

Creates a new deck. Optionally restore from a string representation.

```typescript
// New shuffled deck
const deck = new Deck();

// Restore from string
const restored = new Deck("[AC]-2C-3C-...-KS");
```

#### `shuffle(seed?: number[])`

Shuffles the deck with Fisher-Yates and resets the deal position to the top.

```typescript
// Secure random shuffle
deck.shuffle();

// Deterministic shuffle: 52 non-negative integers; position i swaps with seed[i] % (i + 1)
const seed = Array.from({ length: 52 }, (_, i) => i * 100);
deck.shuffle(seed);
```

For a fair seeded shuffle, `seed[i]` should be uniform in `[0, i]`, which is what an unseeded shuffle generates. Large arbitrary numbers reduced `% (i + 1)` slightly favour low values.

#### `getNext(): Card`

Returns the next card from the top of the deck.

```typescript
const card = deck.getNext();
// { suit: 4, rank: 1, value: 39, mnemonic: "AS" }
```

#### `deal(amount: number): Card[]`

Deals the next `amount` cards. It throws if fewer are left.

```typescript
const hand = deck.deal(5);
```

#### `toMnemonics(format?): string[]`

The deck order, top first, in a chosen notation. Use it to hand a shuffled deck to another engine.

```typescript
deck.toMnemonics();                                  // ["AC", "2C", …, "10C", …]
deck.toMnemonics({ tens: "T", suitCase: "lower" });  // ["Ac", "2c", …, "Tc", …]
```

#### `toString(): string`

Serializes the deck to a string. Current position is marked with brackets.

```typescript
const state = deck.toString();
// "7H-[2C]-KS-..." (2C is next card to be drawn)
```

#### `toJson(): { cards: Card[] }`

Returns the deck state as a JSON object.

#### `hash: string`

SHA256 hash of the current deck order. Changes after each shuffle.

#### `seedHash: string`

SHA256 hash of the seed used for the last shuffle.

### `Card`

```typescript
interface Card {
  suit: SUIT;      // 1-4 (Clubs, Diamonds, Hearts, Spades)
  rank: number;    // 1-13 (Ace through King)
  value: number;   // 0-51 (unique card identifier)
  mnemonic: string; // "AS", "2C", "10H", etc.
}
```

### `SUIT`

```typescript
enum SUIT {
  CLUBS = 1,
  DIAMONDS = 2,
  HEARTS = 3,
  SPADES = 4
}
```

## Card Mnemonics

Cards are represented as rank + suit:

| Rank | Symbol |
|------|--------|
| Ace | A |
| 2-10 | 2-10 (`T` is also accepted for ten) |
| Jack | J |
| Queen | Q |
| King | K |

| Suit | Symbol |
|------|--------|
| Clubs | C |
| Diamonds | D |
| Hearts | H |
| Spades | S |

Examples: `AS` (Ace of Spades), `10H` (Ten of Hearts), `KC` (King of Clubs). `fromString` also reads `TH` and lower-case suits (`Th`), normalising the mnemonic to `10H`.

## String Serialization Format

The `toString()` method serializes the deck to a string that can be stored and restored later. This enables saving game state, transmitting deck state over a network, or debugging.

### Format Structure

```
<card>-<card>-<card>-...-<card>
```

- **52 card mnemonics** separated by hyphens (`-`)
- Cards are listed in deal order: the first card is dealt first
- The **current position** (next card to be drawn) is marked with square brackets

### Position Marker

The bracketed card `[XX]` indicates the next card that will be returned by `getNext()`:

```
AC-2C-3C-[4C]-5C-6C-...
          ^
          Next card to draw
```

### Complete Example

A new, unshuffled deck serializes to:

```
[AC]-2C-3C-4C-5C-6C-7C-8C-9C-10C-JC-QC-KC-AD-2D-3D-4D-5D-6D-7D-8D-9D-10D-JD-QD-KD-AH-2H-3H-4H-5H-6H-7H-8H-9H-10H-JH-QH-KH-AS-2S-3S-4S-5S-6S-7S-8S-9S-10S-JS-QS-KS
```

After drawing 3 cards:

```
AC-2C-3C-[4C]-5C-6C-7C-8C-9C-10C-JC-QC-KC-AD-2D-3D-4D-5D-6D-7D-8D-9D-10D-JD-QD-KD-AH-2H-3H-4H-5H-6H-7H-8H-9H-10H-JH-QH-KH-AS-2S-3S-4S-5S-6S-7S-8S-9S-10S-JS-QS-KS
```

### Saving and Restoring State

```typescript
// Save deck state
const deck = new Deck();
deck.shuffle();
deck.getNext(); // Draw one card
const savedState = deck.toString();

// Later: restore the exact state
const restoredDeck = new Deck(savedState);
const nextCard = restoredDeck.getNext(); // Same card as original deck would return
```

## Verifiable Shuffling

The deck provides cryptographic hashes for verification:

```typescript
const deck = new Deck();
console.log(deck.hash); // Hash of initial deck order

deck.shuffle();
console.log(deck.hash);     // Hash of shuffled deck
console.log(deck.seedHash); // Hash of shuffle seed
```

This enables:
- **Commit-reveal schemes** - Commit to shuffle seed hash before revealing
- **Audit trails** - Verify shuffle integrity after the fact
- **Reproducibility** - Same seed always produces same shuffle

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build
```

## License

MIT
