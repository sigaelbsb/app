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

const PREPOSICIONES = ['de', 'del', 'la', 'las', 'los', 'y', 'e'];
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const ACRONIMOS = ['CEI', 'TDA', 'TDH', 'TDHA', 'ADN', 'UE', 'CE', 'EB', 'PDVSA', 'PDV', 'TI', 'RRHH', 'AIT', 'LB', 'SB'];

export const toTitulo = (value?: string | null): string => {
  if (!value) return '';
  return String(value)
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return '';
      const wLower = word.toLowerCase();
      const wUpper = word.toUpperCase();
      
      if (ROMANOS.includes(wUpper) || ACRONIMOS.includes(wUpper)) {
        return wUpper;
      }
      
      if (PREPOSICIONES.includes(wLower) && index > 0) {
        return wLower;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
