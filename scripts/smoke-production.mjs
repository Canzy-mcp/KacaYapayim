import assert from "node:assert/strict";

const base=process.env.SMOKE_URL||"http://localhost:3005";
const get=async path=>{const response=await fetch(new URL(path,base),{redirect:"manual"});return {response,body:await response.text()};};
const publicPages=["/","/ozellikler","/meslekler","/meslekler/boyaci","/meslekler/tesisatci","/meslekler/klimaci","/meslekler/elektrikci","/rehber/kar-marji-nasil-hesaplanir","/hesaplama-araclari/kar-marji","/metodoloji","/fiyatlandirma"];
for(const path of publicPages){const {response,body}=await get(path);assert.equal(response.status,200,path);assert.match(body,/<h1[ >]/,path);assert.match(body,/<link rel="canonical"/,path);assert.match(body,/<meta property="og:title"/,path);assert.ok(response.headers.get("content-security-policy"),path);}
const {response:privateResponse}=await get("/dashboard");assert.match(privateResponse.headers.get("x-robots-tag")||"",/noindex/);
const {response:quoteResponse}=await get("/t/00000000-0000-4000-8000-000000000000");assert.equal(quoteResponse.status,404);assert.match(quoteResponse.headers.get("x-robots-tag")||"",/noindex/);
const {body:sitemap}=await get("/sitemap.xml");assert.match(sitemap,/<loc>/);for(const forbidden of ["/dashboard","/quotes","/jobs","/customers","/settings","/admin","/t/"])assert.ok(!sitemap.includes(forbidden),forbidden);
const {body:robots}=await get("/robots.txt");assert.match(robots,/Sitemap:/);
const schemas=html=>[...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)].flatMap(match=>{const parsed=JSON.parse(match[1]);return Array.isArray(parsed)?parsed:[parsed]});
const {body:guide}=await get("/rehber/kar-marji-nasil-hesaplanir");const article=schemas(guide).find(item=>item["@type"]==="Article");assert.equal(article?.headline,"Kâr marjı nasıl hesaplanır?");assert.match(guide,/Son güncelleme:/);
const {body:home}=await get("/");assert.ok(schemas(home).some(item=>item["@type"]==="Organization"));
const {body:calculator}=await get("/hesaplama-araclari/kar-marji");assert.match(calculator,/28\.600/);
const {response:health}=await get("/api/health");assert.ok([200,503].includes(health.status));
console.log(`Smoke passed: ${publicPages.length} public pages, indexing, headers, JSON-LD, calculator, health.`);

