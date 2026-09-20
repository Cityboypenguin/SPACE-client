import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';

export type ThemePreference = 'LIGHT' | 'DARK';

const ThemePreferenceDocument = graphql(`
  query ThemePreference {
    themePreference
  }
`);

const SetThemePreferenceDocument = graphql(`
  mutation SetThemePreference($theme: ThemePreference!) {
    setThemePreference(theme: $theme)
  }
`);

export const getThemePreference = async (): Promise<ThemePreference | null | undefined> => {
  const data = await requestDoc(ThemePreferenceDocument, {}, getUserToken());
  return data.themePreference;
};

export const setThemePreference = async (theme: ThemePreference): Promise<ThemePreference> => {
  const data = await requestDoc(SetThemePreferenceDocument, { theme }, getUserToken());
  return data.setThemePreference;
};
