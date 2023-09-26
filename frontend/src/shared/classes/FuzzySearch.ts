import Fuse from "fuse.js";

export class FuzzySearch<T> {
	private readonly items: Array<T>;
	private readonly keys: Fuse.FuseOptionKey<T>[];

	private readonly fuse: Fuse<T>;

	constructor(items: Array<T>, keys: Fuse.FuseOptionKey<T>[]) {
		this.items = items;
		this.keys = keys;
		const options: Fuse.IFuseOptions<T> = {
			keys: keys,
			threshold: 0.5,
			shouldSort: true,
			includeMatches: true,
		};
		this.fuse = new Fuse(items, options);
	}

	search(query: string) {
		return this.fuse.search(query);
	}

	static getKeys<T>(obj: T, key: string = ""): Array<string> {
		return Object.keys(obj as any);
		// recursive function to get all keys of an object
		const keys = [];
		for (const k in obj) {
			if (typeof obj[k] === "object") {
				keys.push(...FuzzySearch.getKeys(obj[k], k));
			} else {
				const keyPrefix = key === "" ? "" : key + ".";
				keys.push(keyPrefix + k);
			}
		}
		return keys;
	}
}

export class FuzzySearchManager<T extends Record<string, string>> {
	private fuses: Map<string, Fuse<any>> = new Map();

	constructor(data: T[]) {
		if (data.length === 0) {
			console.warn("FuzzySearchManager: no data");
			return;
		}
		const keys = FuzzySearch.getKeys(data[0]);

		keys.forEach((key) => {
			this.createFuzzySearch(data, key);
		});
	}

	private createFuzzySearch<T>(items: Array<T>, key: keyof T) {
		const fuse = new Fuse(items, {
			keys: [key as any],
			threshold: 0.1,
			shouldSort: true,
		});
		this.fuses.set(key as string, fuse);
	}

	search<T>(key: keyof T, query: string) {
		const fuse = this.fuses.get(key as string);
		if (!fuse) throw new Error(`No fuzzy search for key ${String(key)}`);
		return fuse.search(query);
	}
}
