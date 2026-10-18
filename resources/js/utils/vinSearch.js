/**
 * VIN-first search shared by the portal's list pages.
 *
 * The VIN is the primary key: any match on it outranks every match on other properties.
 * Every word typed must match something, so extra words narrow the list down.
 */

/** Lower-case and drop spaces/dashes so "1hgcm 82633a" still finds a VIN. */
export const squash = (value) => String(value ?? '').toLowerCase().replace(/[\s\-_/.]+/g, '');

/**
 * How well one term matches an item, or null.
 *
 * @param {object} item
 * @param {string} term already squashed
 * @param {{primary: (item:object)=>any[], secondary: (item:object)=>any[]}} fields
 */
export function matchTerm(item, term, fields) {
    const vin = squash(item.vin);
    if (vin) {
        if (vin === term) return { score: 1000, field: 'VIN' };
        if (vin.startsWith(term)) return { score: 900, field: 'VIN' };
        if (vin.endsWith(term)) return { score: 850, field: 'VIN' };
        if (vin.includes(term)) return { score: 800, field: 'VIN' };
    }

    if (fields.primary(item).map(squash).some((value) => value && value.includes(term))) {
        return { score: 200, field: 'Vehicle or reference' };
    }
    if (fields.secondary(item).map(squash).some((value) => value && value.includes(term))) {
        return { score: 100, field: 'Other details' };
    }

    return null;
}

/** Items matching every word, best matches first. With an empty query everything is returned in order. */
export function rankItems(items, query, fields) {
    const terms = String(query).split(/\s+/).map(squash).filter(Boolean);
    if (terms.length === 0) return items.map((item) => ({ item, field: null }));

    return items
        .map((item, index) => {
            const hits = terms.map((term) => matchTerm(item, term, fields));
            if (hits.some((hit) => hit === null)) return null;
            const best = hits.reduce((top, hit) => (hit.score > top.score ? hit : top), hits[0]);
            return { item, index, field: best.field, score: hits.reduce((sum, hit) => sum + hit.score, 0) };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.index - b.index);
}
