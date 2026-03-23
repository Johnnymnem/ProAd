import { RATING_PROVIDER_OPTIONS, type RatingPreference } from '@/lib/ratingPreferences';

export type RatingProviderRow = { id: RatingPreference; enabled: boolean };

export const buildDefaultRatingRows = (): RatingProviderRow[] =>
  RATING_PROVIDER_OPTIONS.map((o) => ({ id: o.id, enabled: true }));

export const rowsToEnabledOrdered = (rows: RatingProviderRow[]): RatingPreference[] =>
  rows.filter((r) => r.enabled).map((r) => r.id);

/** Enabled providers first (in given order), then disabled in catalog order. */
export const enabledOrderedToRows = (enabledOrdered: RatingPreference[]): RatingProviderRow[] => {
  const enabledSet = new Set(enabledOrdered);
  const catalogIds = RATING_PROVIDER_OPTIONS.map((o) => o.id);
  const orderedIds = [
    ...enabledOrdered,
    ...catalogIds.filter((id) => !enabledSet.has(id)),
  ];
  return orderedIds.map((id) => ({ id, enabled: enabledSet.has(id) }));
};
