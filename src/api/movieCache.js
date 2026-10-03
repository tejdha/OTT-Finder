const store = new Map();

function keyFor(mediaType, id) {
  return `${mediaType}-${id}`;
}

// Call this any time you adapt a list or detail response, so other pages
// (Wishlist, See All, "you might also like") can find the same item later
// without a fresh network call.
export function registerItems(items) {
  items.forEach((item) => {
    store.set(keyFor(item.tmdbMediaType || item.type, item.id), item);
  });
}

export function getCachedItem(mediaType, id) {
  return store.get(keyFor(mediaType, id));
}

export function getCachedItems(refs) {
  // refs: [{ id, mediaType }] — returns only the ones we actually have cached
  return refs.map((r) => getCachedItem(r.mediaType, r.id)).filter(Boolean);
}
