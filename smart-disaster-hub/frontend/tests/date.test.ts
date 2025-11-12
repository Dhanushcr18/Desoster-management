import { describe, it, expect } from 'vitest';
import { formatDistanceToNow, formatDate } from '../src/utils/date';

describe('Date Utilities', () => {
  describe('formatDistanceToNow', () => {
    it('should return "just now" for very recent dates', () => {
      const now = new Date().toISOString();
      expect(formatDistanceToNow(now)).toBe('just now');
    });

    it('should return minutes ago for dates within an hour', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatDistanceToNow(date)).toBe('5 minutes ago');
    });

    it('should return singular "minute ago" for 1 minute', () => {
      const date = new Date(Date.now() - 60 * 1000).toISOString();
      expect(formatDistanceToNow(date)).toBe('1 minute ago');
    });

    it('should return hours ago for dates within a day', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatDistanceToNow(date)).toBe('3 hours ago');
    });

    it('should return days ago for dates within a month', () => {
      const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatDistanceToNow(date)).toBe('5 days ago');
    });

    it('should return months ago for older dates', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatDistanceToNow(date)).toBe('2 months ago');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z').toISOString();
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });
});
