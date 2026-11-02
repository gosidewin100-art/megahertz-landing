/**
 * 광고대행사 실행파트너 랜딩 접수폼 → 구글시트 적재 (이해빈 대표 2026-11-02)
 *
 * ★배포 위치: 지정 스프레드시트에서 직접 열어 붙여넣기 (컨테이너 연결형)
 *   시트: https://docs.google.com/spreadsheets/d/1Hk9cFqFF5YzxAIo6VAaTaFvWGwu9KkYaGg4rH059Xxs/edit
 *   확장 프로그램 > Apps Script > 아래 코드 붙여넣기 > 저장
 *
 * ★기존 '메일db' 탭은 건드리지 않습니다. '랜딩_광고대행사접수' 탭에 자동 누적(없으면 생성).
 *
 * 배포: 배포 > 새 배포 > 유형 '웹 앱' > 실행: 나 / 액세스: '모든 사용자'
 *       → 웹앱 URL(.../exec) 복사 → index.html의 ENDPOINT 값에 붙여넣기.
 * 컬럼(A~I): 접수시각 | 담당자명 | 업체명 | 연락처 | 이메일 | 필요실행 | 동의 | 유입경로 | 랜딩URL
 */
var TAB_NAME = '랜딩_광고대행사접수';
var HEADERS = ['접수시각','담당자명','업체명','연락처','이메일','필요실행','개인정보동의','유입경로','랜딩URL'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch (err) {}

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(TAB_NAME);
    if (!sh) { sh = ss.insertSheet(TAB_NAME); }
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#14213d').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
    var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    sh.appendRow([
      now,
      String(data.name    || '').slice(0, 100),
      String(data.company || '').slice(0, 120),
      normalizeTel_(data.tel || ''),
      String(data.email   || '').slice(0, 120),
      String(data.need    || '').slice(0, 500),
      (String(data.agree || '') === 'Y') ? 'Y' : 'N',
      String(data.ref     || '').slice(0, 300),
      String(data.page    || '').slice(0, 300)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, msg: 'adref lead endpoint alive' });
}

function normalizeTel_(v) {
  var d = String(v).replace(/[^0-9]/g, '');
  if (d.length === 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  if (d.length === 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
  return String(v);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
