import React, { useEffect, useState } from 'react';
import { RRule, Frequency } from 'rrule';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Checkbox, Label } from '@vision-gate/ui'; // Assuming imports
import { format } from 'date-fns';

export interface RecurringOptionsResult {
    rrule: string;
    startDate: Date;
    endDate: Date | null;
    frequency: string;
}

interface RecurringOptionsProps {
    initialStartDate: Date;
    onChange: (result: RecurringOptionsResult) => void;
}

const RecurringOptions: React.FC<RecurringOptionsProps> = ({ initialStartDate, onChange }) => {
    const [frequency, setFrequency] = useState<string>('WEEKLY');
    const [interval, setInterval] = useState<number>(1);
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Mon, 6=Sun (RRule uses MO, TU etc)
    const [endDateType, setEndDateType] = useState<'never' | 'date' | 'count'>('date');
    const [endDate, setEndDate] = useState<string>('');
    const [occurrenceCount, setOccurrenceCount] = useState<number>(10);

    // Initialize selected day based on start date
    useEffect(() => {
        // RRule JS: 0=Mon, 6=Sun? No. RRule.MO is valid. 
        // JS Date.getDay(): 0=Sun, 1=Mon.
        // RRule: 0=Mon (RRule.MO.weekday)
        let day = initialStartDate.getDay() - 1;
        if (day < 0) day = 6; // Sun
        setSelectedDays([day]);
    }, [initialStartDate]);

    // Generate RRULE whenever state changes
    useEffect(() => {
        const rruleOptions: any = {
            freq: frequency === 'DAILY' ? RRule.DAILY : frequency === 'WEEKLY' ? RRule.WEEKLY : RRule.MONTHLY,
            interval: interval,
            dtstart: initialStartDate,
        };

        if (frequency === 'WEEKLY') {
            const weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
            rruleOptions.byweekday = selectedDays.map(d => weekdays[d]);
        }

        if (endDateType === 'date' && endDate) {
            rruleOptions.until = new Date(endDate);
            // Set UNTIL to end of day to be inclusive
            rruleOptions.until.setHours(23, 59, 59);
        } else if (endDateType === 'count') {
            rruleOptions.count = occurrenceCount;
        }

        const rule = new RRule(rruleOptions);

        onChange({
            rrule: rule.toString(),
            startDate: initialStartDate,
            endDate: endDateType === 'date' && endDate ? new Date(endDate) : null,
            frequency
        });
    }, [frequency, interval, selectedDays, endDateType, endDate, occurrenceCount, initialStartDate]);

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            if (selectedDays.length > 1) {
                setSelectedDays(selectedDays.filter(d => d !== dayIndex));
            }
        } else {
            setSelectedDays([...selectedDays, dayIndex].sort());
        }
    };

    const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Interval</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Every</span>
                        <Input
                            type="number"
                            min={1}
                            value={interval}
                            onChange={e => setInterval(parseInt(e.target.value) || 1)}
                            className="w-16"
                        />
                        <span className="text-sm">{frequency.toLowerCase().slice(0, -2)}(s)</span>
                    </div>
                </div>
            </div>

            {frequency === 'WEEKLY' && (
                <div>
                    <Label className="mb-2 block">Repeat on</Label>
                    <div className="flex gap-2">
                        {daysLabels.map((label, idx) => (
                            <div
                                key={idx}
                                onClick={() => toggleDay(idx)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors ${selectedDays.includes(idx) ? 'bg-primary text-primary-foreground' : 'bg-white border hover:bg-slate-100'}`}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <Label className="mb-2 block">Ends</Label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input type="radio" id="end-never" checked={endDateType === 'never'} onChange={() => setEndDateType('never')} />
                        <label htmlFor="end-never">Never (Unlimited)</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="radio" id="end-date" checked={endDateType === 'date'} onChange={() => setEndDateType('date')} />
                        <label htmlFor="end-date">On Date</label>
                        <Input
                            type="date"
                            disabled={endDateType !== 'date'}
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-40 h-8"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="radio" id="end-count" checked={endDateType === 'count'} onChange={() => setEndDateType('count')} />
                        <label htmlFor="end-count">After</label>
                        <Input
                            type="number"
                            disabled={endDateType !== 'count'}
                            value={occurrenceCount}
                            onChange={e => setOccurrenceCount(parseInt(e.target.value) || 1)}
                            className="w-20 h-8"
                        />
                        <span>occurrences</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecurringOptions;
