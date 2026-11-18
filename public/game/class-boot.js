var CLASSROOM=null,BANK=null;
(async()=>{
 const group=new URLSearchParams(location.search).get('group');
 if(!group){location.replace('/portal.html');return;}
 document.querySelector('#app').innerHTML='<div style="padding:70px;text-align:center;font-family:Georgia;color:#47613e">Membuka perjalanan kelompok.</div>';
 try{const response=await fetch('/api/groups/'+encodeURIComponent(group));const data=await response.json();if(!response.ok)throw Error(data.error);CLASSROOM=data;BANK=data.bank;try{localStorage.setItem('riskman_last_game',JSON.stringify({groupId:data.group.id,code:data.group.code}))}catch{}await script('app.js');await script('class-sync.js');}
 catch(e){const root=document.querySelector('#app');root.innerHTML='<div style="padding:60px;max-width:600px;margin:auto"><h2>Perjalanan belum dapat dibuka.</h2><p id="booterror"></p><a href="/portal.html">Kembali ke akademi →</a></div>';document.querySelector('#booterror').textContent=e.message;}
 function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(Error('Gagal memuat permainan.'));document.body.appendChild(el)})}
})();
