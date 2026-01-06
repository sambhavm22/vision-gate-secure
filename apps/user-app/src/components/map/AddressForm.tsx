import { Badge, Input, Label } from '@vision-gate/ui';
import { useTranslation } from 'react-i18next';

export interface AddressFormData {
    label: string;
    fullAddress: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
}

interface AddressFormProps {
    /** Form data */
    value: AddressFormData;
    /** Called when form data changes */
    onChange: (data: AddressFormData) => void;
    /** Whether the form is disabled */
    disabled?: boolean;
    /** Whether to show lat/lng fields */
    showCoordinates?: boolean;
}

const LABEL_OPTIONS = ['Home', 'Work', 'Other'] as const;

/**
 * AddressForm Component
 * 
 * Form for editing address details with label selector,
 * address fields, and optional coordinate display.
 */
export function AddressForm({
    value,
    onChange,
    disabled = false,
    showCoordinates = false
}: AddressFormProps) {
    const { t } = useTranslation();

    const updateField = <K extends keyof AddressFormData>(
        field: K,
        fieldValue: AddressFormData[K]
    ) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            {/* Label Selector */}
            <div className="space-y-2">
                <Label>{t('address.label', 'Label')}</Label>
                <div className="flex gap-2">
                    {LABEL_OPTIONS.map((labelOption) => (
                        <Badge
                            key={labelOption}
                            variant={value.label === labelOption ? 'default' : 'outline'}
                            className="cursor-pointer px-4 py-1.5 transition-colors"
                            onClick={() => !disabled && updateField('label', labelOption)}
                        >
                            {t(`address.${labelOption.toLowerCase()}`, labelOption)}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Full Address */}
            <div className="space-y-2">
                <Label htmlFor="fullAddress">{t('address.address_line', 'Full Address')}</Label>
                <Input
                    id="fullAddress"
                    placeholder={t('address.address_placeholder', 'House/Flat No, Street, Area')}
                    value={value.fullAddress}
                    onChange={(e) => updateField('fullAddress', e.target.value)}
                    disabled={disabled}
                />
            </div>

            {/* City and Pincode */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="city">{t('address.city', 'City')}</Label>
                    <Input
                        id="city"
                        placeholder={t('address.city_placeholder', 'City')}
                        value={value.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pincode">{t('address.pincode', 'Pincode')}</Label>
                    <Input
                        id="pincode"
                        placeholder={t('address.pincode_placeholder', 'Pincode')}
                        value={value.pincode}
                        onChange={(e) => updateField('pincode', e.target.value)}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Coordinates (read-only) */}
            {showCoordinates && value.lat !== 0 && value.lng !== 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="lat" className="text-xs text-muted-foreground">Latitude</Label>
                        <Input
                            id="lat"
                            value={value.lat.toFixed(6)}
                            disabled
                            className="text-xs bg-muted"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lng" className="text-xs text-muted-foreground">Longitude</Label>
                        <Input
                            id="lng"
                            value={value.lng.toFixed(6)}
                            disabled
                            className="text-xs bg-muted"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddressForm;
