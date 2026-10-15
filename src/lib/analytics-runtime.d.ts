export interface AnalyticsTracker {
  track(pathname?: string, title?: string): boolean;
}
export function getAnalytics(measurementId: string): AnalyticsTracker | null;
export function safeLocation(pathname: string): string;
export function safeReferrer(value: string): string;
