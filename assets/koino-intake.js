/* Koino CRM intake v1. Receipt-confirmed, retry-safe.
   2026-11-16 대표님 지시: www.megahertz.co.kr 접수는 대표님 스프레드시트(Apps Script)에도 사본을 남긴다. */
(function () {
  'use strict';
  var endpoint = 'https://koino-crm-nine.vercel.app/api/intake';
  var SHEET = 'https://script.google.com/macros/s/AKfycbyu9rmkn1JKefY83GY4xXPCAMFcMtjo3m6oyiQ1zQB58xRQKqk-6GlRuLR3y2_3Lnu_/exec';
  function toSheet(body) {
    if (body.company_url) return;
    try { fetch(SHEET,{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}).catch(function(){}); } catch(_) {}
  }
  var key = 'koino_intake_v1:' + location.pathname, memory = null;
  function load() {
    try { var x = JSON.parse(sessionStorage.getItem(key) || 'null'); if (x && Date.now() - x.at < 86400000) return x; } catch (_) {}
    return memory;
  }
  function save(x) { memory = x; try { sessionStorage.setItem(key, JSON.stringify(x)); } catch (_) {} }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var a = crypto.getRandomValues(new Uint8Array(16)); a[6] = (a[6] & 15) | 64; a[8] = (a[8] & 63) | 128;
    var s = Array.from(a).map(function (n) { return n.toString(16).padStart(2, '0'); }).join('');
    return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);
  }
  function prepare(body) {
    var fingerprint = JSON.stringify(body), old = load();
    if (old && old.fingerprint === fingerprint) return old;
    var x = {at:Date.now(),fingerprint:fingerprint,id:uuid(),receipt:null}; save(x); return x;
  }
  async function send(body) {
    var item = prepare(body);
    if (item.receipt) return {ok:true,receipt:item.receipt,duplicate:true};
    var payload = Object.assign({}, body, {id:item.id});
    if (!item.sheet) { item.sheet=true; save(item); toSheet(payload); }
    for (var n=0;n<3;n++) {
      var ctl = new AbortController(), timer = setTimeout(function(){ctl.abort();},20000);
      try {
        var r = await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctl.signal});
        var j = await r.json();
        if (!r.ok || !j.ok || !j.receipt) { var err = new Error(j.error || '접수번호를 확인하지 못했습니다.'); err.status=r.status; throw err; }
        item.receipt=j.receipt; save(item); return j;
      } catch(e) {
        if (n===2 || (e.status>=400 && e.status<500)) throw e;
      } finally { clearTimeout(timer); }
      await new Promise(function(resolve){setTimeout(resolve,1000*(n+1));});
    }
  }
  function trap(form) {
    var wrap=document.createElement('div'); wrap.setAttribute('aria-hidden','true');
    wrap.style.cssText='position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';
    var label=document.createElement('label'); label.textContent='이 항목은 비워 두세요';
    var input=document.createElement('input'); input.name='company_url';input.tabIndex=-1;input.autocomplete='off';
    label.appendChild(input);wrap.appendChild(label);form.appendChild(wrap);return input;
  }
  window.KoinoIntake={send:send,trap:trap};
})();
