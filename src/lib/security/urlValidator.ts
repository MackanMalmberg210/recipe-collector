/**
 * SSRF (Server-Side Request Forgery) and URL security validator
 * Prevents requests to private networks, loopback addresses, and cloud metadata services.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254", // AWS, GCP, Azure, DigitalOcean metadata IP
]);

function isPrivateIpV4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [p0, p1] = parts;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;

  // 10.0.0.0/8 (Private)
  if (p0 === 10) return true;

  // 172.16.0.0/12 (Private)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (p0 === 192 && p1 === 168) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata)
  if (p0 === 169 && p1 === 254) return true;

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;

  return false;
}

export type UrlValidationResult = {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
};

/**
 * Validates that an incoming recipe import URL is safe to fetch on the server.
 */
export function validatePublicRecipeUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "Missing or invalid URL." };
  }

  const trimmed = rawUrl.trim();

  // Basic length boundary check
  if (trimmed.length < 4 || trimmed.length > 2048) {
    return { isValid: false, error: "URL length must be between 4 and 2048 characters." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "Invalid URL syntax. Please provide a full URL with http:// or https://." };
  }

  // Strictly enforce http/https protocol
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isValid: false, error: `Protocol "${parsed.protocol}" is not supported. Only http:// and https:// are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block obvious internal / loopback hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { isValid: false, error: "Private or internal hostnames cannot be imported." };
  }

  // Block .local, .internal, .lan, .onion domains
  if (
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".onion") ||
    hostname.endsWith(".home")
  ) {
    return { isValid: false, error: "Internal and local network domains are not allowed." };
  }

  // Check if hostname is an IPv4 literal
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIpv4 && isPrivateIpV4(hostname)) {
    return { isValid: false, error: "Private network IP addresses are not permitted." };
  }

  // Block decimal / octal / hex encoded IP addresses (e.g. 2130706433 or 0x7f000001)
  if (/^0x[0-9a-f]+$/i.test(hostname) || /^\d{8,10}$/.test(hostname)) {
    return { isValid: false, error: "Numeric or encoded IP addresses are not permitted." };
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
  };
}
