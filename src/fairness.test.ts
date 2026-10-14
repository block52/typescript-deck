import { createHash, randomBytes } from "crypto";
import { Deck } from "./deck";
import { randomBelow } from "./random";
import { sha256Hex } from "./sha256";

// Node's crypto is used here only as a reference to test against; the
// package itself does not import it.

describe("sha256Hex", () => {
    it("matches the FIPS 180-4 test vectors", () => {
        expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        expect(sha256Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))
            .toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
    });

    it("matches Node's crypto on random inputs of every padding length", () => {
        for (let len = 0; len < 300; len++) {
            const input = randomBytes(len).toString("base64").slice(0, len) + "ünï€😀".slice(0, len % 6);
            expect(sha256Hex(input)).toBe(createHash("sha256").update(input).digest("hex"));
        }
    });

    it("keeps deck hashes identical to 1.0.0", () => {
        const deck = new Deck();
        const order = deck.toString().replace(/[[\]]/g, "");
        expect(deck.hash).toBe(createHash("sha256").update(order).digest("hex"));
    });
});

describe("seeded shuffle", () => {
    // The 1.0.0 algorithm, verbatim, as the reference.
    function shuffle100(seed: number[]): string {
        const cards = new Deck().toMnemonics();
        for (let i = cards.length - 1; i > 0; i--) {
            const j = seed[i] % (i + 1);
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        return cards.join("-");
    }

    it("reproduces 1.0.0 orders and seed hashes for the same seed", () => {
        for (let k = 0; k < 20; k++) {
            const seed = Array.from({ length: 52 }, () => Math.floor(Math.random() * 1_000_000));
            const deck = new Deck();
            deck.shuffle(seed);
            expect(deck.toMnemonics().join("-")).toBe(shuffle100(seed));
            expect(deck.seedHash).toBe(createHash("sha256").update(seed.join("-")).digest("hex"));
        }
    });

    it("rejects negative or fractional seed values", () => {
        expect(() => new Deck().shuffle(Array(52).fill(-1))).toThrow(/non-negative integers/);
        expect(() => new Deck().shuffle(Array(52).fill(0.5))).toThrow(/non-negative integers/);
    });
});

describe("unseeded shuffle", () => {
    it("never calls Math.random", () => {
        const spy = jest.spyOn(Math, "random").mockImplementation(() => {
            throw new Error("Math.random must not be used");
        });
        try {
            new Deck().shuffle();
        } finally {
            spy.mockRestore();
        }
    });

    it("fails loudly without Web Crypto instead of falling back", () => {
        const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
        Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
        try {
            expect(() => new Deck().shuffle()).toThrow(/getRandomValues is not available/);
        } finally {
            if (original) Object.defineProperty(globalThis, "crypto", original);
        }
    });

    it("commits to its seed, and two shuffles differ", () => {
        const a = new Deck();
        const b = new Deck();
        a.shuffle();
        b.shuffle();
        expect(a.seedHash).toMatch(/^[0-9a-f]{64}$/);
        expect(a.seedHash).not.toBe(b.seedHash);
        expect(a.toMnemonics()).not.toEqual(b.toMnemonics());
    });

    it("puts every card in every position with equal probability (chi-square)", () => {
        const runs = 26_000; // 500 expected per (card, position) cell for the cards checked
        const watched = ["AC", "KS", "7H"];
        const counts = watched.map(() => new Array(52).fill(0));
        for (let r = 0; r < runs; r++) {
            const order = (() => {
                const d = new Deck();
                d.shuffle();
                return d.toMnemonics();
            })();
            watched.forEach((card, c) => counts[c][order.indexOf(card)]++);
        }
        const expected = runs / 52;
        for (const row of counts) {
            const chi2 = row.reduce((sum, n) => sum + ((n - expected) ** 2) / expected, 0);
            // 51 degrees of freedom: p = 0.0001 at about 97.0.
            expect(chi2).toBeLessThan(97);
        }
    });
});

describe("randomBelow", () => {
    it("rejects values that would bias the modulo", () => {
        // bound 3: 2^32 % 3 = 1, so 2^32 - 1 is the one rejected value.
        const values = [0xffffffff, 0xffffffff, 7];
        const source = (b: Uint32Array) => {
            b[0] = values.shift()!;
        };
        expect(randomBelow(3, source)).toBe(7 % 3);
        expect(values).toEqual([]);
    });

    it("covers the whole range", () => {
        const seen = new Set<number>();
        for (let i = 0; i < 2000; i++) seen.add(randomBelow(7));
        expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("rejects bad bounds", () => {
        expect(() => randomBelow(0)).toThrow();
        expect(() => randomBelow(2.5)).toThrow();
    });
});

describe("deal", () => {
    it("deals the next cards in order without skipping", () => {
        const deck = new Deck();
        expect(deck.deal(2).map((c) => c.mnemonic)).toEqual(["AC", "2C"]);
        expect(deck.deal(3).map((c) => c.mnemonic)).toEqual(["3C", "4C", "5C"]);
        expect(deck.getNext().mnemonic).toBe("6C");
    });

    it("refuses to deal past the end", () => {
        const deck = new Deck();
        deck.deal(50);
        expect(() => deck.deal(3)).toThrow(/Cannot deal 3 cards: 2 left/);
    });
});

describe("notation", () => {
    it("parses T for tens and either suit case", () => {
        for (const m of ["TH", "Th", "10h", "10H", "tH"]) {
            const card = Deck.fromString(m);
            expect(card.rank).toBe(10);
            expect(card.mnemonic).toBe("10H");
        }
        expect(Deck.fromString("as").mnemonic).toBe("AS");
        expect(() => Deck.fromString("1H")).toThrow();
        expect(() => Deck.fromString("11H")).toThrow();
    });

    it("exports the order in another engine's notation", () => {
        const deck = new Deck();
        const short = deck.toMnemonics({ tens: "T", suitCase: "lower" });
        expect(short.slice(8, 13)).toEqual(["9c", "Tc", "Jc", "Qc", "Kc"]);
        expect(deck.toMnemonics()[9]).toBe("10C");
        // Round-trips through fromString.
        expect(short.map((m) => Deck.fromString(m).value)).toEqual(deck.toJson().cards.map((c) => c.value));
    });
});
