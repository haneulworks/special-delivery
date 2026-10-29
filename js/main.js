
'use strict';

// ==========================================
// 1. 기본 설정
// ==========================================

const BASE_URL = 'https://haneulworks.github.io/special-delivery/';
const KAKAO_JAVASCRIPT_KEY = 'f6f04b66664ff3dccd99214875b0c02d';
const KAKAO_TEMPLATE_ID = 1384665;
const DUE_DATE = Date.UTC(2027, 5, 20);

// ==========================================
// 2. 이모 / 삼촌 구분
// ==========================================

const params = new URLSearchParams(window.location.search);
const to = params.get('to') === 'uncle' ? 'uncle' : 'aunt';
const recipient = to === 'uncle' ? '삼촌' : '이모';

document.querySelectorAll('[data-recipient]').forEach((el) => {
    el.textContent = recipient;
});

// ==========================================
// 3. D-DAY 계산
// ==========================================

function koreaTodayUTC() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const part = (type) =>
        Number(parts.find((p) => p.type === type).value);

    return Date.UTC(
        part('year'),
        part('month') - 1,
        part('day')
    );
}

function updateDday() {
    const diff = Math.round(
        (DUE_DATE - koreaTodayUTC()) / 86400000
    );

    const ddayText =
        diff > 0 ? `D-${diff}` :
        diff === 0 ? 'D-DAY' :
        `D+${Math.abs(diff)}`;

    const element = document.getElementById('dday-count');

    if (element) {
        element.textContent = ddayText;
    }
}

updateDday();

window.addEventListener('focus', updateDday);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateDday();
    }
});

// ==========================================
// 4. 편지 봉투 애니메이션
// ==========================================

const intro = document.getElementById('intro');
const envelope = document.getElementById('open-envelope');
const card = document.getElementById('announcement');

let opened = false;

if (intro && envelope && card) {
    envelope.addEventListener('click', () => {
        if (opened) return;

        opened = true;
        envelope.disabled = true;

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (reduced) {
            intro.hidden = true;
            card.hidden = false;
            card.classList.add('visible');
            return;
        }

        // STEP 1. 봉투 열기
        envelope.classList.add('opening');

        // STEP 2. 열린 봉투에서 편지지 올라오기
        window.setTimeout(() => {
            envelope.classList.add('letter-out');
        }, 850);

        // STEP 3. 임밍아웃 카드 공개
        window.setTimeout(() => {
            intro.hidden = true;
            card.hidden = false;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.classList.add('visible');
                });
            });

            window.scrollTo(0, 0);
        }, 2300);
    });
}

// ==========================================
// 5. 카카오 SDK 초기화
// ==========================================

function initKakao() {
    if (!window.Kakao) {
        console.warn('카카오 SDK 로드 실패');
        return false;
    }

    try {
        if (!Kakao.isInitialized()) {
            Kakao.init(KAKAO_JAVASCRIPT_KEY);
        }

        return Kakao.isInitialized();
    } catch (error) {
        console.error('카카오 초기화 오류:', error);
        return false;
    }
}

// ==========================================
// 6. 카카오톡 공유
// ==========================================

const shareButton = document.getElementById('kakaotalk-sharing-btn');
const shareStatus = document.getElementById('share-status');
const targetUrl = `${BASE_URL}?to=${to}`;

async function copyShareLink() {
    try {
        await navigator.clipboard.writeText(targetUrl);

        if (shareStatus) {
            shareStatus.textContent = '공유 링크를 복사했어요!';
        } else {
            alert('공유 링크를 복사했어요!');
        }
    } catch (error) {
        if (shareStatus) {
            shareStatus.textContent =
                `이 주소를 공유해 주세요: ${targetUrl}`;
        } else {
            window.prompt('공유할 주소를 복사해 주세요.', targetUrl);
        }
    }
}

function shareKakao() {
    if (!initKakao() || !window.Kakao.Share) {
        copyShareLink();
        return;
    }

    try {
        Kakao.Share.sendCustom({
            templateId: KAKAO_TEMPLATE_ID,
            templateArgs: {
                RECIPIENT: to,
                FW: '특별한 선물'
            }
        });
    } catch (error) {
        console.error('카카오 공유 오류:', error);
        copyShareLink();
    }
}

if (shareButton) {
    shareButton.addEventListener('click', shareKakao);
}
