/* =========================================================================
   수 개념 문제 템플릿 - Number Concept Problems
   문항 구성 원리 적용:
   1. 자릿수, 크기 비교, 뛰어 세기 등 다양한 수 개념
   2. 명확한 발문 ("몇의 자리 숫자는?", "더 큰 수는?")
   3. 매력적 오답 (자릿값 혼동, 크기 비교 오류)
   4. 시각적 이모지로 맥락 제공
   ========================================================================= */

const NUMBER_TEMPLATES = {
    // 크기 비교 (1~2학년)
    comparison: [
        {
            context: '스티커 비교',
            template: (a, b, bigger, smaller, name1, name2) => ({
                question: `⭐ ${name1}이(가) 스티커를 ${a}장, ${name2}이(가) ${b}장 모았어요. 더 많이 모은 티니핑의 스티커 수는 몇 장일까요?`,
                explanation: `${a}와 ${b}를 비교하면 ${bigger}가 더 크므로, 더 많이 모은 티니핑은 ${bigger}장을 가지고 있습니다.`,
                answer: bigger
            })
        },
        {
            context: '줄넘기',
            template: (a, b, bigger, smaller, name1, name2) => ({
                question: `🏃 ${name1}는 줄넘기를 ${a}번, ${name2}는 ${b}번 했어요. 더 많이 한 기록은 몇 번일까요?`,
                explanation: `${a}와 ${b}를 비교하면 ${bigger}가 더 크므로, 더 많이 한 기록은 ${bigger}번입니다.`,
                answer: bigger
            })
        },
        {
            context: '구슬 비교',
            template: (a, b, bigger, smaller) => ({
                question: `🔴🔵 빨간 상자에 구슬 ${a}개, 파란 상자에 ${b}개가 있어요. 더 많은 상자에는 몇 개가 있을까요?`,
                explanation: `${a}와 ${b}를 비교하면 ${bigger}가 더 크므로, 더 많은 상자에는 ${bigger}개가 있습니다.`,
                answer: bigger
            })
        },
        {
            context: '사과 비교',
            template: (a, b, bigger, smaller, name1, name2) => ({
                question: `🍎 ${name1}은 사과 ${a}개, ${name2}은 ${b}개를 가지고 있어요. 더 많이 가진 사과는 몇 개일까요?`,
                explanation: `${a}와 ${b}를 비교하면 ${bigger}가 더 큽니다. 정답은 ${bigger}개입니다.`,
                answer: bigger
            })
        },
        {
            context: '책 비교',
            template: (a, b, bigger, smaller, name1, name2) => ({
                question: `📚 ${name1}은 책 ${a}권, ${name2}은 ${b}권을 읽었어요. 더 많이 읽은 책은 몇 권일까요?`,
                explanation: `${a}와 ${b}를 비교하면 ${bigger}가 더 큽니다. 정답은 ${bigger}권입니다.`,
                answer: bigger
            })
        }
    ],

    // 자릿수 (2~3학년)
    placeValue: [
        {
            context: '카드 번호',
            template: (num, place, val, name1) => ({
                question: `🎴 ${name1}의 카드 번호는 ${num}이에요. ${place}의 자리 숫자는 무엇일까요?`,
                explanation: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.`,
                answer: val
            })
        },
        {
            context: '도서관',
            template: (num, place, val) => ({
                question: `📚 학교 도서관에 책이 ${num}권 있어요. ${place}의 자리 숫자는 무엇일까요?`,
                explanation: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.`,
                answer: val
            })
        },
        {
            context: '아파트',
            template: (num, place, val, name1) => ({
                question: `🏠 ${name1}네 아파트는 ${num}동이에요. ${place}의 자리 숫자는 무엇일까요?`,
                explanation: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.`,
                answer: val
            })
        },
        {
            context: '영화표',
            template: (num, place, val) => ({
                question: `🎟️ 영화표 번호가 ${num}번이에요. ${place}의 자리 숫자는 무엇일까요?`,
                explanation: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.`,
                answer: val
            })
        }
    ],

    // 뛰어 세기 (1~2학년)
    skipCounting: [
        {
            context: '버스 정류장',
            template: (start, step, seq, targetIdx) => ({
                question: `🚌 버스 정류장 번호가 ${start}부터 ${step}씩 커져요. 네 번째 정류장 번호는? (${start}, ${seq[1]}, ${seq[2]}, ?)`,
                explanation: `${start}부터 ${step}씩 커지므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[targetIdx]}. 네 번째 번호는 ${seq[targetIdx]}입니다.`,
                answer: seq[targetIdx]
            })
        },
        {
            context: '사탕 세기',
            template: (start, step, seq, targetIdx, name1) => ({
                question: `🍬 ${name1}이(가) ${step}개씩 묶어서 사탕을 세어요. ${start}부터 시작하면 네 번째 수는 몇일까요?`,
                explanation: `${start}부터 ${step}씩 커지므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[targetIdx]}. 네 번째 수는 ${seq[targetIdx]}입니다.`,
                answer: seq[targetIdx]
            })
        },
        {
            context: '계단 번호',
            template: (start, step, seq, targetIdx) => ({
                question: `🪜 계단 번호가 ${start}, ${seq[1]}, ${seq[2]}, ? 순서예요. ?에 알맞은 수는 몇일까요?`,
                explanation: `${start}부터 ${step}씩 커지므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[targetIdx]}. 네 번째 수는 ${seq[targetIdx]}입니다.`,
                answer: seq[targetIdx]
            })
        },
        {
            context: '수 세기',
            template: (start, step, seq, targetIdx, name1) => ({
                question: `🔢 ${name1}이(가) 수를 세고 있어요. ${step}씩 뛰어 세면 ${start}, ${seq[1]}, ${seq[2]}, ?가 돼요. ?는 몇일까요?`,
                explanation: `${step}씩 뛰어 세므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[targetIdx]}. ?는 ${seq[targetIdx]}입니다.`,
                answer: seq[targetIdx]
            })
        }
    ]
};

// 수 개념 문제 생성 함수
function generateNumberProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, createProblemResult, shuffleArray } = window.ProblemBase;

    const type = Math.floor(Math.random() * 3);
    const [name1, name2] = getTwoCharacters();
    let question, answer, explanation;
    const wrongs = new Set();

    if (type === 0) {
        // 크기 비교
        const a = Math.floor(Math.random() * 90) + 10;
        let b;
        do {
            b = Math.floor(Math.random() * 90) + 10;
        } while (a === b);

        const bigger = Math.max(a, b);
        const smaller = Math.min(a, b);

        const templates = NUMBER_TEMPLATES.comparison;
        const template = templates[Math.floor(Math.random() * templates.length)];
        const result = template.template(a, b, bigger, smaller, name1, name2);

        question = result.question;
        answer = result.answer;
        explanation = result.explanation;

        wrongs.add(smaller);
        wrongs.add(bigger + 1);
        wrongs.add(bigger + 10);

    } else if (type === 1) {
        // 자릿수
        const num = Math.floor(Math.random() * 900) + 100;
        const digit = Math.floor(Math.random() * 3);
        const place = ['일', '십', '백'][digit];
        const val = String(num)[2 - digit];

        const templates = NUMBER_TEMPLATES.placeValue;
        const template = templates[Math.floor(Math.random() * templates.length)];
        const result = template.template(num, place, val, name1);

        question = result.question;
        answer = result.answer;
        explanation = result.explanation;

        while (wrongs.size < 3) {
            const w = Math.floor(Math.random() * 10);
            if (String(w) !== answer) wrongs.add(String(w));
        }

    } else {
        // 뛰어 세기
        const start = Math.floor(Math.random() * 50) + 1;
        const step = [2, 5, 10][Math.floor(Math.random() * 3)];
        const targetIdx = 3;

        const seq = [];
        for (let i = 0; i < 5; i++) seq.push(start + i * step);

        const templates = NUMBER_TEMPLATES.skipCounting;
        const template = templates[Math.floor(Math.random() * templates.length)];
        const result = template.template(start, step, seq, targetIdx, name1);

        question = result.question;
        answer = result.answer;
        explanation = result.explanation;

        wrongs.add(seq[targetIdx] - step);
        wrongs.add(seq[targetIdx] + step);
        wrongs.add(seq[targetIdx] + step * 2);
    }

    const wrongsArray = Array.from(wrongs).filter(w => String(w) !== String(answer)).slice(0, 3);

    return createProblemResult(question, answer, explanation, wrongsArray, 'number', difficulty);
}

// 전역으로 내보내기
window.NumberProblems = {
    TEMPLATES: NUMBER_TEMPLATES,
    generate: generateNumberProblem
};
