function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = value instanceof Date ? value.toISOString() : String(value);
  // Anti CSV/formula injection: una celda que empieza con = + - @ (o tab/CR)
  // puede ejecutarse como fórmula al abrirla en Excel/Sheets. Se neutraliza
  // anteponiendo un apóstrofo para que se trate como texto.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvValue(row[h])).join(","));
  }
  return lines.join("\n");
}
