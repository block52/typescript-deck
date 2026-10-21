import { Deck } from "./deck";
import { cardName, rankName, suitName } from "./names";
import { SUIT } from "./types";

describe("rankName", () => {
    it.each([
        [1, "Ace"],
        [14, "Ace"],
        [2, "Two"],
        [6, "Six"],
        [10, "Ten"],
        [11, "Jack"],
        [12, "Queen"],
        [13, "King"]
    ])("rankName(%i) → %s", (rank, name) => {
        expect(rankName(rank)).toBe(name);
    });

    it("pluralises, including Sixes", () => {
        expect(rankName(1, true)).toBe("Aces");
        expect(rankName(6, true)).toBe("Sixes");
        expect(rankName(10, true)).toBe("Tens");
        expect(rankName(13, true)).toBe("Kings");
    });

    it("rejects a rank outside 1–14", () => {
        expect(() => rankName(0)).toThrow(RangeError);
        expect(() => rankName(15)).toThrow(RangeError);
    });
});

describe("suitName", () => {
    it("names every suit, plural by default", () => {
        expect(suitName(SUIT.CLUBS)).toBe("Clubs");
        expect(suitName(SUIT.DIAMONDS)).toBe("Diamonds");
        expect(suitName(SUIT.HEARTS)).toBe("Hearts");
        expect(suitName(SUIT.SPADES)).toBe("Spades");
        expect(suitName(SUIT.SPADES, false)).toBe("Spade");
    });

    it("rejects an unknown suit", () => {
        expect(() => suitName(0 as SUIT)).toThrow(RangeError);
    });
});

describe("cardName", () => {
    it("names a card from the deck", () => {
        expect(cardName(Deck.fromString("AS"))).toBe("Ace of Spades");
        expect(cardName(Deck.fromString("10H"))).toBe("Ten of Hearts");
        expect(cardName(Deck.fromString("Td"))).toBe("Ten of Diamonds");
        expect(cardName(Deck.fromString("2C"))).toBe("Two of Clubs");
    });
});
