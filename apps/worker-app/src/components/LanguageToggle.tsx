import { Button } from '@vision-gate/ui';
import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'hi' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="font-medium text-muted-foreground hover:text-primary"
        >
            {i18n.language === 'en' ? 'हिंदी' : 'English'}
        </Button>
    );
}
