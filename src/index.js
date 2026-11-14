const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {"content-type":"application/json; charset=utf-8", "cache-control":"no-store","x-content-type-options":"nosniff"}});
const html = (body) => new Response(body,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' https: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
async function authorized(request, secret) {
  const candidate=request.headers.get("Authorization")?.replace(/^Bearer /,"") || "";
  if (!secret || !candidate || candidate.length > 512) return false;
  const [a,b]=await Promise.all([crypto.subtle.digest("SHA-256",new TextEncoder().encode(candidate)),crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret))]);
  const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
async function upstream(url,options,key) {
  const response=await fetch(url,{...options,headers:{...options?.headers,Authorization:"Bearer "+key},signal:AbortSignal.timeout(20000)});
  let result;try{result=await response.json()}catch{result={error:"Invalid upstream response"}}
  if(!response.ok) return json({error:"xAI request failed",status:response.status,detail:typeof result?.error==="string"?result.error:result?.error?.message||"Check API permissions, balance and model availability"},response.status>=500?502:400);
  return json(result);
}
export default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if(request.method==="GET"&&url.pathname==="/")return html(INDEX_HTML);
  if(request.method==="GET"&&(url.pathname==="/app.js"||url.pathname==="/style.css"))return env.ASSETS.fetch(request);
  if(url.pathname==="/health"&&request.method==="GET")return json({ok:true,app:"星渊 AI 漫剧工坊 V0.1",configured:!!env.XAI_API_KEY&&!!env.APP_ADMIN_TOKEN});
  if(!url.pathname.startsWith("/api/"))return json({error:"Not found"},404);
  if(!await authorized(request,env.APP_ADMIN_TOKEN))return json({error:"Unauthorized"},401);
  if(!env.XAI_API_KEY)return json({error:"XAI_API_KEY not configured"},503);
  if(request.method==="POST"&&url.pathname==="/api/generate") {
   if(request.headers.get("origin")!==url.origin)return json({error:"Origin check failed"},403);
   let data;try{data=await request.json()}catch{return json({error:"Invalid JSON"},400)}
   const prompt=String(data.prompt||"").trim(), duration=Number(data.duration), model=String(data.model||"");
   if(prompt.length<10||prompt.length>6000||!Number.isInteger(duration)||duration<3||duration>10)return json({error:"Prompt must be 10-6000 characters; duration 3-10 seconds"},400);
   if(!["grok-imagine-video-1.5","grok-imagine-video-1.5-lite"].includes(model))return json({error:"Unsupported model"},400);
   return upstream("https://api.x.ai/v1/videos/generations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({model,prompt,duration,aspect_ratio:"9:16",resolution:"480p"})},env.XAI_API_KEY);
  }
  const match=url.pathname.match(/^\/api\/status\/([a-zA-Z0-9-]{8,100})$/);
  if(request.method==="GET"&&match)return upstream("https://api.x.ai/v1/videos/"+encodeURIComponent(match[1]),{},env.XAI_API_KEY);
  return json({error:"Not found"},404);
 }
};
import { INDEX_HTML } from "./page.js";
