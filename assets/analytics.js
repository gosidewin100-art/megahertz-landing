/* 메가헤르츠 방문 통계 로더 (2026-11-16 준비).
   아이디 두 칸이 모두 비어 있으면 아무것도 불러오지 않는다(쿠키·외부 요청 0).
   아이디를 받으면 아래 한두 줄만 채우고 이 파일의 ?v= 를 올려 배포한다.
   - GA4_ID   : GA4 > 관리 > 데이터 스트림 > 웹(megahertz.co.kr) > 측정 ID (G-로 시작)
   - NAVER_WA : 네이버 애널리틱스(analytics.naver.com) > 사이트 등록(megahertz.co.kr) 후 받은 사이트 ID
   이벤트(개인정보 넣지 않음): contact_click {channel}, generate_lead {form} (접수번호를 받은 뒤 1회) */
(function () {
  'use strict';
  var GA4_ID = '';
  var NAVER_WA = '';
  if (!GA4_ID && !NAVER_WA) return;

  function add(src) {
    var s = document.createElement('script'); s.async = true; s.src = src;
    document.head.appendChild(s); return s;
  }

  var gtag = function () {};
  if (GA4_ID) {
    window.dataLayer = window.dataLayer || [];
    gtag = window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4_ID);
    add('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID));
  }

  if (NAVER_WA) {
    var w = add('https://wcs.naver.net/wcslog.js');
    w.onload = function () {
      try {
        window.wcs_add = window.wcs_add || {}; window.wcs_add.wa = NAVER_WA;
        if (window.wcs && window.wcs_do) window.wcs_do();
      } catch (_) {}
    };
  }

  function channelOf(href) {
    if (/^tel:/i.test(href)) return 'phone';
    if (/^sms:/i.test(href)) return 'sms';
    if (/open\.kakao\.com|pf\.kakao\.com/i.test(href)) return 'kakao';
    if (/talk\.naver\.com/i.test(href)) return 'naver_talk';
    if (/instagram\.com/i.test(href)) return 'instagram';
    if (/#apply$|\/free\//i.test(href)) return 'form_link';
    return '';
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var ch = channelOf(a.getAttribute('href') || '');
    if (ch) gtag('event', 'contact_click', { channel: ch });
  }, true);

  function wrapIntake() {
    var K = window.KoinoIntake;
    if (!K || !K.send || K.__mhzWrapped) return;
    var orig = K.send;
    K.send = function (body) {
      return orig.apply(this, arguments).then(function (res) {
        if (res && res.ok && !res.duplicate) gtag('event', 'generate_lead', { form: location.pathname });
        return res;
      });
    };
    K.__mhzWrapped = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrapIntake);
  else wrapIntake();
})();
