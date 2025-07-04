// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: parse-coffee
// Deploy with: supabase functions deploy parse-coffee
// Docs: https://supabase.com/docs/guides/functions

import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import vision from 'npm:@google-cloud/vision';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { fetchProductPage } from './scraper.ts';

interface ParseCoffeeRequest {
  image: string; // base-64 string (no data URI prefix)
}

// Utility: return JSON response quickly
const jsonResponse = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Only POST allowed' }, 405);
  }

  try {
    const { image }: ParseCoffeeRequest = await req.json();
    if (!image) {
      return jsonResponse({ error: 'image field missing' }, 400);
    }

    /* ---------------------- 1. OCR via Vision ---------------------- */
    const visionClient = new vision.ImageAnnotatorClient();
    const [result] = await visionClient.textDetection({ image: { content: image } });
    const rawText = result.fullTextAnnotation?.text || '';

    /* ---------------------- 2. Gemini prompt ---------------------- */
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'));
    const prompt = `You are an expert barista. Extract structured JSON with the keys name and roaster from the following coffee bag text. Reply ONLY with JSON.\n\nTEXT:\n"""${rawText}"""`;
    const genRes = await genAI.generateText({ model: 'gemini-pro', prompt });

    let structured: { name?: string; roaster?: string } = {};
    try {
      structured = JSON.parse(genRes.text);
    } catch (_e) {
      // Gemini sometimes adds text — fallback simple regex extraction
      structured.name = rawText.split('\n')[0] || '';
      structured.roaster = rawText.split('\n')[1] || '';
    }

    /* ---------------------- 3. Search product page ---------------------- */
    const query = `${structured.name} ${structured.roaster} coffee`;
    const searchUrl =
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${Deno.env.get('SERPAPI_KEY')}`;
    const serp = await fetch(searchUrl).then((r) => r.json());
    const firstLink = serp.organic_results?.[0]?.link as string | undefined;

    let scrapedData: Record<string, unknown> = {};
    if (firstLink) {
      scrapedData = await fetchProductPage(firstLink);
    }

    return jsonResponse({ ...structured, ...scrapedData, sourceUrl: firstLink });
  } catch (err) {
    console.error('parse-coffee error', err);
    return jsonResponse({ error: 'internal_error', details: `${err}` }, 500);
  }
});