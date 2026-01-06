import React, { createContext, useContext, ReactNode } from 'react';
import { AddressProvider } from './AddressProvider';
import { mockAddressProvider } from './MockAddressProvider';

/**
 * Context for providing address provider throughout the app
 * Enables easy swapping between providers (Mock, Google, Mapbox, etc.)
 */
const AddressProviderContext = createContext<AddressProvider>(mockAddressProvider);

interface AddressProviderWrapperProps {
    provider?: AddressProvider;
    children: ReactNode;
}

/**
 * Provider wrapper component
 * Default: MockAddressProvider
 * Pass custom provider prop to use different implementation
 */
export function AddressProviderWrapper({
    provider = mockAddressProvider,
    children
}: AddressProviderWrapperProps) {
    return (
        <AddressProviderContext.Provider value={provider}>
            {children}
        </AddressProviderContext.Provider>
    );
}

/**
 * Hook to access the address provider
 * @returns The current AddressProvider instance
 */
export function useAddressProvider(): AddressProvider {
    return useContext(AddressProviderContext);
}
