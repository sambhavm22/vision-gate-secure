import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@vision-gate/ui';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useAddressProvider, AddressSearchResult } from '@/lib/address';

interface AddressSearchProps {
    /** Called when user selects an address from results */
    onSelect: (result: AddressSearchResult) => void;
    /** Placeholder text for the search input */
    placeholder?: string;
    /** Whether the search is disabled */
    disabled?: boolean;
}

/**
 * AddressSearch Component
 * 
 * Debounced search input that queries the address provider.
 * Displays dropdown results that can be selected.
 */
export function AddressSearch({
    onSelect,
    placeholder = 'Search for an address...',
    disabled = false
}: AddressSearchProps) {
    const provider = useAddressProvider();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AddressSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!query || query.trim().length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchResults = await provider.search(query);
                setResults(searchResults);
                setShowResults(searchResults.length > 0);
            } catch (error) {
                console.error('Address search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, provider]);



    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback((result: AddressSearchResult) => {
        onSelect(result);
        setQuery(result.label);
        setShowResults(false);
    }, [onSelect]);

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-10 pr-10"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
            </div>

            {/* Results Dropdown - Relative positioning pushing content down */}
            {showResults && results.length > 0 && (
                <div className="mt-2 w-full bg-background border rounded-lg shadow-sm max-h-60 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={result.id}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full px-4 py-3 text-left hover:bg-accent flex items-start gap-3 transition-colors border-b last:border-b-0"
                        >
                            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{result.label}</p>
                                <p className="text-xs text-muted-foreground">
                                    {result.city} - {result.pincode}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AddressSearch;
