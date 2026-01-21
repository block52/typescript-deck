# @block52/deck

A TypeScript implementation of a standard 52-card deck with cryptographic shuffling. Perfect for poker applications, card games, and any project requiring verifiable randomness.

## Features

- **Standard 52-card deck** - All suits and ranks properly implemented
- **Fisher-Yates shuffle** - Cryptographically sound shuffling algorithm
- **Deterministic seeding** - Reproduce exact shuffle results with seed arrays
- **SHA256 hashing** - Verify deck state and shuffle integrity
- **Serialization** - Save and restore deck state from string representation
- **Zero dependencies** - Only uses Node.js built-in `crypto` module

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

Shuffles the deck using the Fisher-Yates algorithm.

```typescript
// Random shuffle
deck.shuffle();

// Deterministic shuffle (seed must be 52 numbers)
const seed = Array.from({ length: 52 }, (_, i) => i * 100);
deck.shuffle(seed);
```

#### `getNext(): Card`

Returns the next card from the top of the deck.

```typescript
const card = deck.getNext();
// { suit: 4, rank: 1, value: 39, mnemonic: "AS" }
```

#### `deal(amount: number): Card[]`

Deals multiple cards from the deck.

```typescript
const hand = deck.deal(5);
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
| 2-10 | 2-10 |
| Jack | J |
| Queen | Q |
| King | K |

| Suit | Symbol |
|------|--------|
| Clubs | C |
| Diamonds | D |
| Hearts | H |
| Spades | S |

Examples: `AS` (Ace of Spades), `10H` (Ten of Hearts), `KC` (King of Clubs)

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
