import { Card, SUIT } from "./types";

const RANK_NAMES: Record<number, [string, string]> = {
    1: ["Ace", "Aces"],
    2: ["Two", "Twos"],
    3: ["Three", "Threes"],
    4: ["Four", "Fours"],
    5: ["Five", "Fives"],
    6: ["Six", "Sixes"],
    7: ["Seven", "Sevens"],
    8: ["Eight", "Eights"],
    9: ["Nine", "Nines"],
    10: ["Ten", "Tens"],
    11: ["Jack", "Jacks"],
    12: ["Queen", "Queens"],
    13: ["King", "Kings"]
};

const SUIT_NAMES: Record<SUIT, [string, string]> = {
    [SUIT.CLUBS]: ["Club", "Clubs"],
    [SUIT.DIAMONDS]: ["Diamond", "Diamonds"],
    [SUIT.HEARTS]: ["Heart", "Hearts"],
    [SUIT.SPADES]: ["Spade", "Spades"]
};

/**
 * The rank in words: `rankName(1)` → "Ace", `rankName(10)` → "Ten".
 * Accepts this library's ranks (1 = Ace … 13 = King) and the high-ace 14 that
 * hand evaluators use for an ace. `plural` gives "Aces", "Sixes", "Tens".
 * @throws RangeError for a rank outside 1–14
 */
export function rankName(rank: number, plural = false): string {
    const names = RANK_NAMES[rank === 14 ? 1 : rank];
    if (!names) {
        throw new RangeError(`invalid rank: ${rank}`);
    }
    return plural ? names[1] : names[0];
}

/**
 * The suit in words: `suitName(SUIT.SPADES)` → "Spades"; `plural = false` gives
 * "Spade" (as in "Spade Flush").
 * @throws RangeError for an unknown suit
 */
export function suitName(suit: SUIT, plural = true): string {
    const names = SUIT_NAMES[suit];
    if (!names) {
        throw new RangeError(`invalid suit: ${suit}`);
    }
    return plural ? names[1] : names[0];
}

/** The card in words: `cardName(Deck.fromString("AS"))` → "Ace of Spades". */
export function cardName(card: Card): string {
    return `${rankName(card.rank)} of ${suitName(card.suit)}`;
}
