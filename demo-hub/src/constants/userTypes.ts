export const USER_TYPES = [
  { value: 'SE', label: 'Sales Engineer (SE)' },
  { value: 'AE', label: 'Account Executive (AE)' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Other', label: 'Other' }
] as const;

export type UserType = typeof USER_TYPES[number]['value'];

export const DEFAULT_USER_TYPE: UserType = 'Other';

export const getUserTypeLabel = (value: UserType): string => {
  const userType = USER_TYPES.find(type => type.value === value);
  return userType?.label || value;
};

export const isValidUserType = (value: string): value is UserType => {
  return USER_TYPES.some(type => type.value === value);
};
