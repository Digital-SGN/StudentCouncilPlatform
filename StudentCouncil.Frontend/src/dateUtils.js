export function toLocalInputValue(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
           `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToISO(localValue) {
    if (!localValue) return null;
    return new Date(localValue).toISOString();
}

export function formatDateOnly(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
}