export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  let numbers = value.replace(/\D/g, '');
  if (numbers.startsWith('58') && numbers.length > 10) {
    numbers = numbers.substring(2);
  }
  const truncated = numbers.slice(0, 11);
  if (truncated.length > 4) {
    return `${truncated.slice(0, 4)}-${truncated.slice(4)}`;
  }
  return truncated;
};
