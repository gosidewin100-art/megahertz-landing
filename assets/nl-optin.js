/* nl-optin-20261021: 소식 메일 수신동의 체크 칸 공용 설정.
 * valueText: 자료 가치 표기(예: ' (OO원 상당)'). 실제 판매가 같은 근거가 확인되기 전까지 비워 둔다(표시광고법).
 * 문구를 바꾸면 version 도 올리고 Apps Script NL_VERSION 도 같이 올린다. */
window.NL_OPTIN = { version: 'v1_20261021', valueText: '' };
(function () {
  var v = window.NL_OPTIN.valueText;
  if (!v) return;
  var els = document.querySelectorAll('.nl-value');
  for (var i = 0; i < els.length; i++) els[i].textContent = ' ' + v;
})();
