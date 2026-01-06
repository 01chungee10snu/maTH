/* =========================================================================
   전역 설정 및 상수
   ========================================================================= */
const SUPABASE_URL = 'https://ttuhtceuxrjybfqgutkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dWh0Y2V1eHJqeWJmcWd1dGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTAyMTMsImV4cCI6MjA3OTc2NjIxM30.Qtewubz0SwlO-G9OqDyPVyebiZ11iD3FelBGtl7url8';

const DPR = Math.min(2, window.devicePixelRatio || 1);
const CANVAS = document.getElementById('app');
const CTX = CANVAS.getContext('2d');
const ERROR_BOX = document.getElementById('err');
const LS_KEY = 'taehee-math-division-canvas';

// 전역 상태 객체
let STATE = {
  mode: 'map', // home | map | quiz | explain | catch | collection | complete
  questionIndex: 0,
  totalQuestions: 0,
  score: 0,
  difficulty: 2, // 2~19 (2단부터 19단까지)
  consecutiveCorrect: 0,
  caughtIds: [],
  usedProblems: [], // 이미 출제된 문제 추적
  // 문제
  problem: null,
  selected: null,
  isCorrect: null,
  // 해설 확인
  confirmed: null,
  // 캐치 애니메이션
  catchStart: 0,
  newTiniping: null,
  // 히트박스 저장
  hitboxes: [],
  // 현재 선택된 커리큘럼 (기본값: 나눗셈)
  currentCurriculum: 'division',
  // 맵 선택 상태
  mapSelection: {
    grade: null, // 'elementary_school', 'middle_school', 'high_school'
    subGrade: null, // '1-2학년', '1학년' 등
    domain: null // '수와 연산' 등
  },
  // 컬렉션 탭 상태
  collectionTab: '전체',
  // 미지수 문제 상태
  symbolAnswers: {
    square: null,   // □ 선택값
    circle: null,   // ○ 선택값
    triangle: null  // △ 선택값
  }
};

let TINIPINGS = [];
let ENCYCLOPEDIA = [];
let NAME2IMG = new Map();
let IMAGE_CACHE = new Map();
let CURRICULUM_DATA = null;

const shownErrorMessages = new Set();
let SCALE = 1;
let lastCssW = null;
let lastCssH = null;

function now() { return performance.now(); }
