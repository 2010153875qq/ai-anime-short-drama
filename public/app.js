const $=id=>document.getElementById(id);
let running=false;
function message(t){$("message").textContent=t}
function headers(){return {"authorization":"Bearer "+$("token").value}}
async function api(path,options={}){
 const response=await fetch(path,{...options,headers:{...headers(),...options.headers},cache:"no-store"});
 const data=await response.json().catch(()=>({error:"服务响应解析失败"}));
 if(!response.ok)throw Error(data.detail||data.error||"请求失败");
 return data;
}
async function poll(){
 const id=$("requestId").value.trim();if(!id){message("请填写任务编号");return}
 try{
  const result=await api("/api/status/"+encodeURIComponent(id));
  if(result.status==="done"&&result.video?.url){
   $("video").src=result.video.url;$("video").hidden=false;$("download").href=result.video.url;$("download").hidden=false;
   message("视频生成成功，请检查并及时保存。");running=false;$("generate").disabled=false;
  }else if(["failed","expired"].includes(result.status)){message("任务状态："+result.status);running=false;$("generate").disabled=false}
  else message("视频处理中："+(result.status||"pending")+"。可再次点击查询。");
 }catch(err){message("查询失败："+err.message)}
}
$("generate").addEventListener("click",async()=>{
 if(running)return;
 if(!confirm("确认向 xAI 提交付费视频生成请求？"))return;
 running=true;$("generate").disabled=true;$("video").hidden=true;$("download").hidden=true;message("正在提交任务…");
 try{
  const result=await api("/api/generate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt:$("scene").value,model:$("model").value,duration:Number($("duration").value)})});
  if(!result.request_id)throw Error("未返回任务编号");
  $("requestId").value=result.request_id;message("已提交，任务编号："+result.request_id+"。点击查询结果查看状态。");
 }catch(err){message("提交失败："+err.message)}
 finally{running=false;$("generate").disabled=false}
});
$("check").addEventListener("click",poll);
