export function timeFormat(time: number | undefined | null): string {
    if (time === undefined || time === null || isNaN(time) || time <= 0) return `0 sec`;

    let days = Math.floor(time / 86400);
    let hours = Math.floor((time % 86400) / 3600);
    let mins = Math.floor((time % 3600) / 60);
    let secs = Math.floor(time % 60);

    let parts: string[] = [];
    if (days > 0) parts.push(`${days} д`);
    if (hours > 0) parts.push(`${hours} ч`);
    if (mins > 0) parts.push(`${mins} мин`);
    if (secs > 0 && parts.length < 2) parts.push(`${secs} сек`);

    return parts.length > 0 ? parts.join(' ') : '0 сек';
}