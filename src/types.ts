/**
 * Represents the four suits in a standard deck of cards.
 */
export enum SUIT {
    CLUBS = 1,
    DIAMONDS = 2,
    HEARTS = 3,
    SPADES = 4
}

/**
 * Represents a playing card.
 */
export interface Card {
    /** The suit of the card */
    suit: SUIT;
    /** The rank of the card (1=Ace, 2-10, 11=Jack, 12=Queen, 13=King) */
    rank: number;
    /** Numeric value for card comparison (0-51) */
    value: number;
    /** String representation of the card (e.g., "AS" for Ace of Spades) */
    mnemonic: string;
}

/**
 * Interface for deck operations.
 */
export interface IDeck {
    /** Shuffle the deck with an optional seed for deterministic results */
    shuffle(seed?: number[]): void;
    /** Get the next card from the deck */
    getNext(): Card;
}

/**
 * Interface for JSON serialization.
 */
export interface IJSONModel {
    toJson(): unknown;
}
