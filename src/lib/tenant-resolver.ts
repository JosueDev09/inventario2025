// Reemplaza este MAP por una consulta real a tu BD (companies/domains)
const MAP: Record<string, { id: string; slug: string; name: string }> = {
  // Dominios propios
  "empresa-a.com": { id: "A", slug: "a", name: "Empresa A" },
  "empresa-b.com": { id: "B", slug: "b", name: "Empresa B" },
  // Subdominios de tu dominio principal (wildcard *.tuapp.com)
  "a.tuapp.com":   { id: "A", slug: "a", name: "Empresa A" },
  "b.tuapp.com":   { id: "B", slug: "b", name: "Empresa B" },
};

// Si usas subdominios, extrae el subdominio y mapea a slug
function resolveBySubdomain(host: string) {
  // Ajusta el dominio base:
  const base = ".tuapp.com"; // p. ej. .tuapp.com o .vercel.app en preview
  if (host.endsWith(base)) {
    const sub = host.slice(0, -base.length);
    if (sub && sub !== "www") {
      const key = `${sub}${base}`;
      return MAP[key];
    }
  }
  return null;
}

export function resolveCompanyFromHost(hostRaw: string | null | undefined) {
  if (!hostRaw) return null;
  const host = hostRaw.toLowerCase();

  // 1) Intento match directo (dominio propio)
  if (MAP[host]) return MAP[host];

  // 2) Intento por subdominio (*.tuapp.com)
  const sub = resolveBySubdomain(host);
  if (sub) return sub;

  // 3) Dev/local: localhost:3000 → usa un tenant fijo o querystring (?tenant=a)
  if (host.startsWith("localhost") || host.includes("127.0.0.1")) {
    // Por simplicidad en dev, fija A:
    return MAP["a.tuapp.com"] ?? { id: "A", slug: "a", name: "Empresa A" };
  }

  return null;
}
