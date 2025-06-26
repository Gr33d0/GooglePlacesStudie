export const normalizePlaceData = (place) => {
    return [
    place.business_status || null,
    place.geometry?.location?.lat ?? null,
    place.geometry?.location?.lng ?? null,
    place.geometry?.viewport?.northeast?.lat ?? null,
    place.geometry?.viewport?.northeast?.lng ?? null,
    place.geometry?.viewport?.southwest?.lat ?? null,
    place.geometry?.viewport?.southwest?.lng ?? null,
    place.icon || null,
    place.icon_background_color || null,
    place.icon_mask_base_uri || null,
    place.name || null,
    place.opening_hours?.open_now ?? null,
    JSON.stringify(place.photos || []),
    place.place_id || null,
    place.plus_code?.compound_code || null,
    place.plus_code?.global_code || null,
    place.price_level ?? null,
    place.rating ?? null,
    place.reference || null,
    place.scope || null,
    place.types || [],
    place.user_ratings_total ?? null,
    place.vicinity || null
  ];
}