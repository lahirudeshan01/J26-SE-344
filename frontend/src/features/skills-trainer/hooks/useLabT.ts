import { useCallback } from 'react';
import { useLanguage } from '../../../app/providers/LanguageContext';
import { labStrings, type LabStringKey } from '../../../shared/i18n/skillsTrainerStrings';

export function useLabT() {
  const { language } = useLanguage();
  return useCallback((key: LabStringKey) => labStrings[language][key], [language]);
}
