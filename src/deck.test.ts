import { Deck } from "./deck";
import { Card, SUIT } from "./types";

describe("Deck", () => {
    let deck: Deck;

    beforeEach(() => {
        deck = new Deck();
    });

    describe("constructor", () => {
        it("should initialize with default values", () => {
            expect(deck.hash).toBeDefined();
            expect(deck.seedHash).toBeDefined();
        });

        it("should initialize with standard 52-card deck", () => {
            const mnemonic = "AC-2C-3C-4C-5C-6C-7C-8C-9C-10C-JC-QC-KC-" +
                "AD-2D-3D-4D-5D-6D-7D-8D-9D-10D-JD-QD-KD-" +
                "AH-2H-3H-4H-5H-6H-7H-8H-9H-10H-JH-QH-KH-" +
                "AS-2S-3S-4S-5S-6S-7S-8S-9S-10S-JS-QS-KS";

            const deck = new Deck(mnemonic);
            const json = deck.toJson();
            expect(json.cards).toHaveLength(52);
        });

        it("should serialize to string", () => {
            const mnemonic = "[AC]-2C-3C-4C-5C-6C-7C-8C-9C-10C-JC-QC-KC-" +
                "AD-2D-3D-4D-5D-6D-7D-8D-9D-10D-JD-QD-KD-" +
                "AH-2H-3H-4H-5H-6H-7H-8H-9H-10H-JH-QH-KH-" +
                "AS-2S-3S-4S-5S-6S-7S-8S-9S-10S-JS-QS-KS";

            const deck = new Deck(mnemonic);
            expect(deck.toString()).toEqual(mnemonic);
        });

        it("should throw error for invalid deck length", () => {
            expect(() => new Deck("AC-2C-3C")).toThrow("Deck must contain 52 cards.");
        });
    });

    describe("shuffle", () => {
        it("should shuffle cards with provided seed", () => {
            const seed = Array.from({ length: 52 }, (_, i) => i);
            deck.shuffle(seed);

            const deck2 = new Deck();
            deck2.shuffle(seed);

            expect(deck.toJson()).toEqual(deck2.toJson());
        });

        it("should shuffle cards with random seed when none provided", () => {
            const originalCards = [...deck.toJson().cards];
            deck.shuffle();
            const shuffledCards = deck.toJson().cards;

            const hasChanged = shuffledCards.some((card: Card, index: number) => card.mnemonic !== originalCards[index].mnemonic);
            expect(hasChanged).toBeTruthy();
        });

        it("should throw error for invalid seed length", () => {
            expect(() => deck.shuffle([1, 2, 3])).toThrow("Seed length (3) must match cards length (52)");
        });

        it("should generate seedHash after shuffling", () => {
            const initialSeedHash = deck.seedHash;
            deck.shuffle();
            expect(deck.seedHash).not.toEqual(initialSeedHash);
        });
    });

    describe("getCardMnemonic", () => {
        it("should convert number cards correctly", () => {
            expect(deck.getCardMnemonic(SUIT.SPADES, 2)).toBe("2S");
            expect(deck.getCardMnemonic(SUIT.HEARTS, 10)).toBe("10H");
        });

        it("should convert face cards correctly", () => {
            expect(deck.getCardMnemonic(SUIT.CLUBS, 11)).toBe("JC");
            expect(deck.getCardMnemonic(SUIT.DIAMONDS, 12)).toBe("QD");
            expect(deck.getCardMnemonic(SUIT.HEARTS, 13)).toBe("KH");
            expect(deck.getCardMnemonic(SUIT.SPADES, 1)).toBe("AS");
        });
    });

    describe("getNext and deal", () => {
        it("should draw next card correctly", () => {
            const card = deck.getNext();
            expect(card).toBeDefined();
            expect(card.suit).toBeDefined();
            expect(card.rank).toBeDefined();
            expect(card.value).toBeDefined();
            expect(card.mnemonic).toBeDefined();

            const nextCard = deck.getNext();
            expect(nextCard).toBeDefined();
            expect(card).not.toEqual(nextCard);
        });

        it("should deal multiple cards", () => {
            const cards = deck.deal(5);
            expect(cards).toHaveLength(5);
            cards.forEach((card: Card) => {
                expect(card).toBeDefined();
                expect(card.suit).toBeDefined();
                expect(card.rank).toBeDefined();
                expect(card.value).toBeDefined();
                expect(card.mnemonic).toBeDefined();
            });

            const nextCard = deck.getNext();
            expect(nextCard).toBeDefined();
            expect(cards[0]).not.toEqual(nextCard);
        });
    });

    describe("toJson", () => {
        it("should serialize deck state", () => {
            const json = deck.toJson();
            expect(json).toHaveProperty("cards");
            expect(Array.isArray(json.cards)).toBeTruthy();
        });
    });

    describe("initStandard52", () => {
        it("should create a standard 52-card deck", () => {
            const json = deck.toJson();
            expect(json.cards).toHaveLength(52);

            const hasAceOfSpades = json.cards.some((card: Card) => card.suit === SUIT.SPADES && card.rank === 1);
            expect(hasAceOfSpades).toBeTruthy();
        });
    });

    describe("hash generation", () => {
        it("should create different hashes for different card orders", () => {
            const originalHash = deck.hash;
            const originalOrder = deck
                .toJson()
                .cards.map((c: Card) => c.mnemonic)
                .join(",");

            deck.shuffle([
                52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
                16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
            ]);

            const newOrder = deck
                .toJson()
                .cards.map((c: Card) => c.mnemonic)
                .join(",");

            expect(newOrder).not.toEqual(originalOrder);
            expect(deck.hash).not.toEqual(originalHash);
        });
    });

    describe("fromString", () => {
        it("should parse valid card mnemonics", () => {
            const aceOfSpades = Deck.fromString("AS");
            expect(aceOfSpades.suit).toBe(SUIT.SPADES);
            expect(aceOfSpades.rank).toBe(1);

            const tenOfHearts = Deck.fromString("10H");
            expect(tenOfHearts.suit).toBe(SUIT.HEARTS);
            expect(tenOfHearts.rank).toBe(10);

            const kingOfClubs = Deck.fromString("KC");
            expect(kingOfClubs.suit).toBe(SUIT.CLUBS);
            expect(kingOfClubs.rank).toBe(13);
        });

        it("should throw error for invalid mnemonics", () => {
            expect(() => Deck.fromString("XX")).toThrow("Invalid card mnemonic: XX");
            expect(() => Deck.fromString("")).toThrow("Invalid card mnemonic: ");
        });
    });
});
