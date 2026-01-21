import { createHash } from "crypto";
import { Card, IDeck, IJSONModel, SUIT } from "./types";

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * A standard 52-card deck implementation with cryptographic shuffling.
 *
 * Features:
 * - Fisher-Yates shuffle algorithm with deterministic seeding
 * - SHA256 hash generation for deck state verification
 * - Serialization to/from string representation
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
     * Shuffles the deck using Fisher-Yates algorithm.
     * @param seed Optional array of numbers for deterministic shuffling. Must match deck length (52).
     */
    public shuffle(seed?: number[]): void {
        if (!seed || seed.length === 0) {
            seed = Array.from({ length: this.cards.length }, () => Math.floor(1000000 * Math.random()));
        }

        if (seed.length !== this.cards.length) {
            throw new Error(`Seed length (${seed.length}) must match cards length (${this.cards.length})`);
        }

        const seedAsString = seed.join("-");
        this.seedHash = createHash("sha256").update(seedAsString).digest("hex");

        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = seed[i] % (i + 1);
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

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
        this.top += amount;
        return Array.from({ length: amount }, () => this.getNext());
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
        this.hash = createHash("sha256").update(cardsAsString).digest("hex");
    }

    /**
     * Parses a card mnemonic string into a Card object.
     * @param mnemonic Card mnemonic (e.g., "AS" for Ace of Spades)
     * @returns Card object
     */
    public static fromString(mnemonic: string): Card {
        const match = mnemonic.match(/^([AJQKajqk]|[0-9]+)([CDHS])$/i);

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
            mnemonic
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
