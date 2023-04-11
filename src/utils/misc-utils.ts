export const generateUUID = (): string => crypto.randomUUID();

export const trimName = (name: string): string => {
  return name.split('$')[0];
};

export const shortenAgency = (agency: string): string => {
  return agency
    .split('_')
    .map(e => e.charAt(0))
    .join('');
};
