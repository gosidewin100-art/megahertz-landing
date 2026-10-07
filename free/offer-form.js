/* 무료 제공물 신청 폼 공용 전송 스크립트 (2026-10-07, 리드 유실 방지)
 * - 서버가 저장 후 접수번호(receipt)를 돌려줘야만 '접수 완료'.
 * - 실패·타임아웃이면 1s, 2s, 4s 간격으로 3번 더 시도.
 * - 그래도 실패하면 이 브라우저에 보관했다가 다음 방문·새로고침 때 다시 보낸다. 입력값은 지우지 않는다.
 * 설정: window.OFFER_CFG = {webapp, track, seg, submit, done, kakao, ping}
 * 테스트: ?test=1 (알림 제외 표시), ?simfail=1 (첫 시도만 서버 오류 흉내)
 */
(function () {
  var C = window.OFFER_CFG; if (!C) return;
  var QKEY = 'offer_q_v1', q = new URLSearchParams(location.search);
  var TEST = q.get('test') === '1', SIMFAIL = q.get('simfail') === '1';
  var f = document.getElementById('f'), msg = document.getElementById('msg'), btn = document.getElementById('btn');
  function v(id) { var x = document.getElementById(id); return x ? x.value.trim() : ''; }
  function loadQ() { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch (e) { return []; } }
  function saveQ(a) { try { localStorage.setItem(QKEY, JSON.stringify(a)); } catch (e) {} }
  function post(body, fail) {
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return fetch(C.webapp + (fail ? '?fail=1' : ''), {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body), redirect: 'follow', signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(timer);
      if (j && j.ok && j.receipt) return j;
      throw new Error((j && j.error) || 'no receipt');
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function send(body, simfail) {
    var waits = [1000, 2000, 4000], n = 0;
    function attempt() {
      return post(body, simfail && n === 0).catch(function (e) {
        if (n >= waits.length) throw e;
        var w = waits[n++];
        return new Promise(function (r) { setTimeout(r, w); }).then(attempt);
      });
    }
    return attempt();
  }
  function show(text, kind, withKakao) {
    msg.innerHTML = '';
    msg.appendChild(document.createTextNode(text));
    if (withKakao) {
      var a = document.createElement('a'); a.href = C.kakao; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = '1:1카톡무료상담으로 남기기';
      a.style.cssText = 'display:block;margin-top:10px;background:#e8603c;color:#fff;text-align:center;padding:12px;border-radius:10px;text-decoration:none;font-weight:800';
      msg.appendChild(a);
    }
    msg.className = 'msg ' + kind;
  }
  // 지난번에 보관해 둔 신청이 있으면 먼저 다시 보낸다.
  (function flush() {
    var a = loadQ(); if (!a.length) return;
    var keep = [], i = 0;
    (function next() {
      if (i >= a.length) { saveQ(keep); return; }
      var item = a[i++];
      send(item.body, false).then(function (j) {
        C.ping('resend_ok_' + C.seg);
        if (item.body.track === C.track) show('지난번 지연됐던 신청이 접수됐습니다. 접수번호 ' + j.receipt, 'ok', false);
        next();
      }, function () { keep.push(item); next(); });
    })();
  })();
  f.addEventListener('submit', function (ev) {
    ev.preventDefault(); msg.className = 'msg';
    var miss = [].slice.call(f.querySelectorAll('[required]')).filter(function (x) { return !x.value.trim(); });
    if (miss.length) { show('필수 항목을 채워 주세요.', 'err'); miss[0].focus(); return; }
    if (v('email').indexOf('@') < 1) { show('이메일 주소를 확인해 주세요.', 'err'); return; }
    if (!document.getElementById('agree').checked) { show('개인정보 수집·이용에 동의해 주셔야 신청할 수 있습니다.', 'err'); return; }
    btn.disabled = true; btn.textContent = '보내는 중...';
    var body = { kind: 'offer_form', track: C.track, seg: C.seg, biz: v('biz'), email: v('email'), phone: v('phone'),
                 links: v('links'), note: v('note') + (C.extra ? C.extra() : ''), agree: true, test: TEST };
    send(body, SIMFAIL).then(function (j) {
      C.ping('submit_' + C.seg);
      f.querySelectorAll('input,textarea').forEach(function (x) { x.disabled = true; });
      btn.textContent = '신청 완료';
      show(C.done + ' 접수번호 ' + j.receipt, 'ok', false);
    }, function () {
      var a = loadQ(); a.push({ at: Date.now(), body: body }); saveQ(a);
      C.ping('submit_queued_' + C.seg);
      btn.disabled = false; btn.textContent = C.submit;
      show('접수가 지연되고 있습니다. 입력하신 내용은 이 기기에 보관해 두었다가 다시 보내드립니다. 카톡으로도 남겨 주세요.', 'err', true);
    });
  });
})();
