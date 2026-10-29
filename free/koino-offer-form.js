/* Koino application intake: the original offer_q_v1 queue is intentionally not replayed. */
(function () {
  'use strict';
  var C=window.OFFER_CFG, f=document.getElementById('f'), msg=document.getElementById('msg'),btn=document.getElementById('btn');
  if(!C||!f||!window.KoinoIntake)return;
  var honeypot=KoinoIntake.trap(f), busy=false;
  function v(id){var x=document.getElementById(id);return x?x.value.trim():'';}
  function show(text,kind){msg.textContent=text;msg.className='msg '+kind;msg.setAttribute('role','status');}
  try { if(JSON.parse(localStorage.getItem('offer_q_v1')||'[]').length) show('이전에 접수가 지연된 기록이 있습니다. 중복 접수를 피하려면 기존 접수 여부를 상담으로 확인해주세요.','err'); }catch(_){}
  f.addEventListener('submit',async function(ev){
    ev.preventDefault();if(busy)return;
    if(!f.reportValidity())return;
    if(!document.getElementById('agree').checked){show('개인정보 수집·이용에 동의해 주셔야 신청할 수 있습니다.','err');return;}
    var body={kind:C.track==='shortform'?'shortform':'channel',name:v('biz'),email:v('email'),phone:v('phone'),contact:'',links:v('links'),note:v('note')+(C.extra?C.extra():''),industry:({clinic:'병의원',academy:'학원',cafe:'카페·커뮤니티'})[C.track]||'',channels:'',track:C.track,seg:C.seg,
      source_url:location.origin+location.pathname+location.search,privacy:true,optin:!!document.getElementById('optin').checked,privacyVer:'offer_v1',optinVer:window.NL_OPTIN?NL_OPTIN.version:'v1_20261021',test:new URLSearchParams(location.search).get('test')==='1',company_url:honeypot.value};
    busy=true;btn.disabled=true;btn.textContent='접수 중...';show('접수를 확인하고 있습니다.','');
    try {
      var j=await KoinoIntake.send(body);
      f.querySelectorAll('input,textarea,select').forEach(function(x){x.disabled=true;});btn.textContent='신청 완료';
      show(C.done+' 접수번호 '+j.receipt,'ok');
    } catch(e) {
      busy=false;btn.disabled=false;btn.textContent=C.submit;
      show((e.message||'접수를 확인하지 못했습니다.')+' 입력 내용이 남아 있습니다. 같은 버튼으로 다시 시도해주세요.','err');
    }
  });
})();
