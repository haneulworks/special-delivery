'use strict';

const BASE_URL = 'https://haneulworks.github.io/special-delivery/';
const KAKAO_JAVASCRIPT_KEY = ''; // TODO: 카카오 디벨로퍼스 > 앱 키 > JavaScript 키 입력
const DUE_DATE = Date.UTC(2027, 5, 20); // 2027-06-20
const params = new URLSearchParams(window.location.search);
const to = params.get('to') === 'uncle' ? 'uncle' : 'aunt';
const recipient = to === 'uncle' ? '삼촌' : '이모';

document.querySelectorAll('[data-recipient]').forEach((el) => {
  el.textContent = recipient;
});

function koreaTodayUTC() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const part = (type) => Number(parts.find((p) => p.type === type).value);
  return Date.UTC(part('year'), part('month') - 1, part('day'));
}
function updateDday() {
  const diff = Math.round((DUE_DATE - koreaTodayUTC()) / 86400000);
  document.getElementById('dday-count').textContent =
    diff > 0 ? `D-${diff}` : diff === 0 ? 'D-DAY' : `D+${Math.abs(diff)}`;
}
updateDday();
// 탭을 다시 열었을 때 날짜 갱신
window.addEventListener('focus', updateDday);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDday(); });

const intro = document.getElementById('intro');
const envelope = document.getElementById('open-envelope');
const card = document.getElementById('announcement');
let opened = false;
envelope.addEventListener('click', () => {
  if (opened) return;
  opened = true;
  envelope.classList.add('opening');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(() => {
    intro.hidden = true;
    card.hidden = false;
    requestAnimationFrame(() => card.classList.add('visible'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, reduced ? 0 : 1250);
});

const shareButton = document.getElementById('share-kakao');
const shareStatus = document.getElementById('share-status');
const targetUrl = `${BASE_URL}?to=${to}`;
shareButton.addEventListener('click', async () => {
  if (KAKAO_JAVASCRIPT_KEY && window.Kakao && window.Kakao.Share) {
    try {
      if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '선물이 도착했어요 💌',
          description: '당신에게 도착한 특별한 편지, 지금 열어보세요 ♡',
          imageUrl: `${BASE_URL}images/og-image.png`,
          link: { mobileWebUrl: targetUrl, webUrl: targetUrl }
        },
        buttons: [{ title: '선물 열어보기 🎁', link: { mobileWebUrl: targetUrl, webUrl: targetUrl } }]
      });
      return;
    } catch (err) { console.error('카카오 공유 오류', err); }
  }
  // 키 미설정 또는 SDK 오류 시 공유 링크 복사로 대체
  try {
    await navigator.clipboard.writeText(targetUrl);
    shareStatus.textContent = '공유 링크를 복사했어요! 카카오톡에 붙여넣어 주세요.';
  } catch {
    shareStatus.textContent = `이 주소를 공유해 주세요: ${targetUrl}`;
  }
});
