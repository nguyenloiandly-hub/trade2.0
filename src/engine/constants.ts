import { Timeframe } from '../types';

/** Timeframes considered "higher" for HTF bias checks */
export const HIGHER_TIMEFRAMES: Timeframe[] = ['4h', '6h', '8h', '12h', '1d'];

/** ATR tolerance used to cluster nearby S/R levels into a single zone (mid-range of 0.25–0.6 ATR) */
export const ZONE_CLUSTER_ATR_MULTIPLIER = 0.5;

/**
 * Absolute price tolerance used when merging globally-aggregated zones.
 * Expressed in price units (not ATR), acting as a minimum merge window.
 */
export const ZONE_MERGE_MIN_WIDTH = 50;
