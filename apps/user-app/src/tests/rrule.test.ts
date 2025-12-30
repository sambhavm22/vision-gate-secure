import { describe, it, expect } from 'vitest';
import { RRule } from 'rrule';

// Mock function to simulate what we use in our components
const createRRule = (freq: number, interval: number, dtstart: Date, until?: Date, count?: number) => {
    const options: any = {
        freq,
        interval,
        dtstart,
    };
    if (until) options.until = until;
    if (count) options.count = count;

    return new RRule(options).toString();
};

const parseRRuleToText = (rruleString: string) => {
    try {
        const rrule = RRule.fromString(rruleString);
        return rrule.toText();
    } catch (e) {
        return 'Invalid Rule';
    }
};

describe('RRULE Logic', () => {
    const startDate = new Date('2024-01-01T09:00:00Z');

    it('should generate valid weekly rrule', () => {
        const rule = createRRule(RRule.WEEKLY, 1, startDate);
        expect(rule).toContain('FREQ=WEEKLY');
        expect(rule).toContain('DTSTART');
    });

    it('should handle count end condition', () => {
        const rule = createRRule(RRule.DAILY, 1, startDate, undefined, 10);
        expect(rule).toContain('COUNT=10');
        expect(rule).not.toContain('UNTIL');
    });

    it('should handle until date end condition', () => {
        const endDate = new Date('2024-02-01');
        const rule = createRRule(RRule.MONTHLY, 1, startDate, endDate);
        expect(rule).toContain('UNTIL=20240201');
    });

    it('should parse simple rule to text', () => {
        const rule = 'DTSTART:20240101T090000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1';
        const text = parseRRuleToText(rule);
        expect(text).toBe('every week'); // RRule default text format
    });

    it('should parse complex rule to text', () => {
        const rule = 'DTSTART:20240101T090000Z\nRRULE:FREQ=MONTHLY;BYDAY=1FR;COUNT=5';
        const text = parseRRuleToText(rule);
        expect(text).toBe('every month on the 1st Friday for 5 times');
    });
});
