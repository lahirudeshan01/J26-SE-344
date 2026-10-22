import { useLanguage } from '../../../app/providers/LanguageContext';
import { steamStrings, type SteamStrings } from '../data/steamDistillation';

export function useSteamStrings(): SteamStrings {
  const { language } = useLanguage();
  return steamStrings[language];
}
