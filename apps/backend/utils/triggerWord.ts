export const generateTriggerWord = (name: string): string => {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
    return `${sanitized}${suffix}`; // e.g. "john2a4f9c"
};