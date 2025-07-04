// @ts-nocheck
import cheerio from 'npm:cheerio';

export async function fetchProductPage(url: string) {
  try {
    const html = await fetch(url, { headers: { 'User-Agent': 'NiceCoffeeBot/1.0' } }).then((r) => r.text());
    const $ = cheerio.load(html);
    return {
      image: $('meta[property="og:image"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
    };
  } catch (_e) {
    return {};
  }
}