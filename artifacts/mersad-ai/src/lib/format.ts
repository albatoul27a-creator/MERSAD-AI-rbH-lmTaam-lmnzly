const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export const kwd = (n: number) => nf.format(n) + ' د.ك';
export const num = (n: number) => nf.format(n);
export const pct = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';
export function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('ar-KW-u-nu-latn', { month: 'long' });
}
export function dateLabel(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('ar-KW-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
}
export const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
