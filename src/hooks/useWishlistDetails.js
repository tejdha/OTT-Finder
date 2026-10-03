import { useEffect, useState } from "react";
import { getDetails } from "../api/tmdb";
import { adaptDetails } from "../api/adapters";
import { getCachedItem, registerItems } from "../api/movieCache";

export function useWishlistDetails(wishlist, watchRegion) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (wishlist.length === 0) { setItems([]); setLoading(false); return; }
    setLoading(true);

    Promise.all(
      wishlist.map(async (ref) => {
        const cached = getCachedItem(ref.mediaType, ref.id);
        if (cached && cached.watchProviders) return cached;
        try {
          const raw = await getDetails(ref.mediaType, ref.id);
          const full = { ...adaptDetails(raw, ref.mediaType, watchRegion), tmdbMediaType: ref.mediaType };
          registerItems([full]);
          return full;
        } catch (e) {
          return cached || null;
        }
      })
    ).then((results) => {
      if (!cancelled) setItems(results.filter(Boolean));
    }).finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [wishlist, watchRegion]);

  return { items, loading };
}