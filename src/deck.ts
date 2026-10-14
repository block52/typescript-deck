import { randomBelow } from "./random";
import { sha256Hex } from "./sha256";
import { Card, IDeck, IJSONModel, SUIT } from "./types";

/** How {@link Deck.toMnemonics} writes cards. */
export interface MnemonicFormat {
    /** "10" (default, e.g. "10H") or "T" ("TH"), the usual poker notation. */
    tens?: "10" | "T";
    /** "upper" (default, "AS") or "lower" ("As"). */
    suitCase?: "upper" | "lower";
}

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * A standard 52-card deck with a cryptographically secure, unbiased shuffle.
 *
 * Features:
 * - Fisher-Yates shuffle; unseeded shuffles draw from Web Crypto
 *   `getRandomValues` (never `Math.random`)
 * - Deterministic shuffles from a recorded seed, committed to by `seedHash`
 * - SHA-256 hash of the deck order for verification
 * - Serialization to/from string representation
 * - No dependencies; runs in Node 20+, browsers and edge runtimes
 *
 * @example
 * ```typescript
 * const deck = new Deck();
 * deck.shuffle();
 * const card = deck.getNext();
 * console.log(card.mnemonic); // e.g., "AS" for Ace of Spades
 * ```
 */
export class Deck implements IDeck, IJSONModel {
    private cards: Card[] = [];

    /** SHA256 hash of the current deck state */
    public hash: string = "";

    /** SHA256 hash of the seed used for shuffling */
    public seedHash: string;

    private top: number = 0;

    /**
     * Creates a new deck.
     * @param deck Optional string representation of a deck to restore from
     */
    constructor(deck?: string) {
        if (deck) {
            const mnemonics = deck.split("-");
            if (mnemonics.length !== 52) {
                throw new Error("Deck must contain 52 cards.");
            }

            this.cards = [];

            for (let i = 0; i < mnemonics.length; i++) {
                if (mnemonics[i].startsWith("[") && mnemonics[i].endsWith("]")) {
                    mnemonics[i] = mnemonics[i].substring(1, mnemonics[i].length - 1);
                    this.top = i;
                }

                this.cards.push(Deck.fromString(mnemonics[i]));
            }
        } else {
            this.initStandard52();
        }

        this.hash = ZERO_HASH;
        this.createHash();
        this.seedHash = ZERO_HASH;
    }

    /**
     * Shuffles the deck with Fisher-Yates.
     *
     * With no seed, the swap for position i is drawn uniformly from [0, i]
     * with Web Crypto randomness (rejection sampling, so no modulo bias), and
     * that draw becomes the seed. With a seed, the shuffle is deterministic:
     * position i swaps with `seed[i] % (i + 1)`, so replaying the same seed
     * reproduces the same order. Either way `seedHash` commits to the seed,
     * so a dealer can publish it before the hand and reveal the seed after.
     *
     * For a fair seeded shuffle, seed[i] should be uniform in [0, i]: an
     * arbitrary large number reduced `% (i + 1)` slightly favours low values.
     *
     * @param seed Optional array of 52 non-negative integers.
     */
    public shuffle(seed?: number[]): void {
        if (!seed || seed.length === 0) {
            seed = this.cards.map((_, i) => randomBelow(i + 1));
        }

        if (seed.length !== this.cards.length) {
            throw new Error(`Seed length (${seed.length}) must match cards length (${this.cards.length})`);
        }
        if (seed.some((n) => !Number.isInteger(n) || n < 0)) {
            throw new Error("Seed values must be non-negative integers");
        }

        this.seedHash = sha256Hex(seed.join("-"));

        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = seed[i] % (i + 1);
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        this.top = 0;
        this.createHash();
    }

    /**
     * Gets the mnemonic string for a card.
     * @param suit The suit of the card
     * @param rank The rank of the card (1-13)
     * @returns Mnemonic string (e.g., "AS" for Ace of Spades)
     */
    public getCardMnemonic(suit: SUIT, rank: number): string {
        const rankNum = Number(rank);

        const rankMap: Record<number, string> = {
            1: "A",
            11: "J",
            12: "Q",
            13: "K"
        };

        const suitMap: Record<number, string> = {
            [SUIT.CLUBS]: "C",
            [SUIT.DIAMONDS]: "D",
            [SUIT.HEARTS]: "H",
            [SUIT.SPADES]: "S"
        };

        const rankStr = rankMap[rankNum] !== undefined ? rankMap[rankNum] : rankNum.toString();
        const suitStr = suitMap[suit];

        return `${rankStr}${suitStr}`;
    }

    /**
     * Gets the next card from the top of the deck.
     * @returns The next card
     */
    public getNext(): Card {
        return this.cards[this.top++];
    }

    /**
     * Deals multiple cards from the deck.
     * @param amount Number of cards to deal
     * @returns Array of dealt cards
     */
    public deal(amount: number): Card[] {
        if (this.top + amount > this.cards.length) {
            throw new Error(`Cannot deal ${amount} cards: ${this.cards.length - this.top} left`);
        }
        return Array.from({ length: amount }, () => this.getNext());
    }

    /**
     * The deck order as mnemonics, top first — for handing a shuffled deck to
     * an engine that has its own card notation.
     *
     * @example
     * deck.toMnemonics({ tens: "T", suitCase: "lower" }); // ["As", "Td", …]
     */
    public toMnemonics(format: MnemonicFormat = {}): string[] {
        return this.cards.map((card) => Deck.formatCard(card, format));
    }

    /** Writes one card in the given notation. */
    public static formatCard(card: Card, format: MnemonicFormat = {}): string {
        const rank = card.rank === 10 && format.tens === "T" ? "T" : Deck.rankString(card.rank);
        const suit = ["C", "D", "H", "S"][card.suit - 1];
        return rank + (format.suitCase === "lower" ? suit.toLowerCase() : suit);
    }

    private static rankString(rank: number): string {
        return ({ 1: "A", 11: "J", 12: "Q", 13: "K" } as Record<number, string>)[rank] ?? rank.toString();
    }

    /**
     * Serializes the deck to a JSON object.
     * @returns Object containing the cards array
     */
    public toJson(): { cards: Card[] } {
        return {
            cards: this.cards
        };
    }

    /**
     * Serializes the deck to a string representation.
     * The current top position is marked with brackets (e.g., "[AC]").
     * @returns String representation of the deck
     */
    public toString(): string {
        const mnemonics: string[] = [];

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];

            if (i === this.top) {
                mnemonics.push(`[${card.mnemonic}]`);
            } else {
                mnemonics.push(card.mnemonic);
            }
        }

        return mnemonics.join("-");
    }

    private createHash(): void {
        const cardMnemonics = this.cards.map(card => card.mnemonic);
        const cardsAsString = cardMnemonics.join("-");
        this.hash = sha256Hex(cardsAsString);
    }

    /**
     * Parses a card mnemonic string into a Card object.
     * Accepts "10" or "T" for tens and either suit case ("TH", "10h", "Th").
     * The card's mnemonic is normalised to this package's own form ("10H").
     * @param mnemonic Card mnemonic (e.g., "AS" for Ace of Spades)
     * @returns Card object
     */
    public static fromString(mnemonic: string): Card {
        const match = mnemonic.match(/^([AJQKTajqkt]|[2-9]|10)([CDHS])$/i);

        if (!match) {
            throw new Error(`Invalid card mnemonic: ${mnemonic}`);
        }

        const rankStr = match[1].toUpperCase();
        const suitChar = match[2].toUpperCase();

        let rank: number;
        switch (rankStr) {
            case "A": rank = 1; break;
            case "J": rank = 11; break;
            case "Q": rank = 12; break;
            case "K": rank = 13; break;
            case "T": rank = 10; break;
            default: rank = parseInt(rankStr, 10); break;
        }

        let suit: SUIT;
        switch (suitChar) {
            case "C": suit = SUIT.CLUBS; break;
            case "D": suit = SUIT.DIAMONDS; break;
            case "H": suit = SUIT.HEARTS; break;
            case "S": suit = SUIT.SPADES; break;
            default:
                throw new Error(`Invalid suit character: ${suitChar}`);
        }

        return {
            suit,
            rank,
            value: 13 * (suit - 1) + (rank - 1),
            mnemonic: Deck.rankString(rank) + suitChar
        };
    }

    private initStandard52(): void {
        this.cards = [];
        for (let suit = SUIT.CLUBS; suit <= SUIT.SPADES; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                this.cards.push({
                    suit: suit,
                    rank: rank,
                    value: 13 * (suit - 1) + (rank - 1),
                    mnemonic: this.getCardMnemonic(suit, rank)
                });
            }
        }
        this.createHash();
    }
}
