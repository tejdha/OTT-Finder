export function isWishlisted(wishlist, id, mediaType) {
  return wishlist.some((w) => w.id === id && w.mediaType === mediaType);
}

export function toggleWishlistRef(wishlist, ref) {
  const exists = isWishlisted(wishlist, ref.id, ref.mediaType);
  return exists
    ? wishlist.filter((w) => !(w.id === ref.id && w.mediaType === ref.mediaType))
    : [...wishlist, ref];
}
