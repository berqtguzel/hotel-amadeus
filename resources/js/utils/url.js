const LOCALES = ["de", "en", "tr"];

/**
 * URL'de locale yoksa ekler. /about -> /de/about, /de/about -> /de/about
 * Eğer geçersiz bir locale varsa, onu düzeltir: /de/es -> /de
 */
export function ensureLocaleInUrl(url, locale) {
    if (!url || typeof url !== "string" || url.startsWith("http")) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    const parts = path.split("/").filter(Boolean);
    const first = parts[0]?.toLowerCase();
    
    // Eğer URL'nin ilk kısmı geçersiz bir locale ise ve kalan kısım da locale değilse
    if (!LOCALES.includes(first) && parts.length > 0) {
        // Tüm parts'ı kontrol et, locale olmayan ilk kısmı sil
        return `/${locale}${path}`;
    }
    
    // Eğer first bir locale ise ama ikinci part da locale ise (örn: /de/es)
    if (LOCALES.includes(first) && parts.length > 1) {
        const second = parts[1]?.toLowerCase();
        if (LOCALES.includes(second)) {
            // İkinci locale'i sil, sadece ilkini sakla
            return `/${first}/${parts.slice(2).join("/")}`;
        }
    }
    
    if (LOCALES.includes(first)) return path;
    return `/${locale}${path}`;
}
