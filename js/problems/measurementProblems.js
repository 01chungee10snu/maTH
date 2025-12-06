/* =========================================================================
   시간/측정 문제 템플릿 - Measurement Problems
   문항 구성 원리 적용:
   1. 시계 읽기, 시간 계산, 길이/무게 비교 등
   2. 명확한 발문 ("몇 시일까요?", "얼마나 걸릴까요?")
   3. 매력적 오답 (시/분 혼동, 단위 오류)
   4. 시각적 이모지로 상황 표현
   ========================================================================= */

const MEASUREMENT_TEMPLATES = {
    // 시계 읽기 (1~2학년)
    clockReading: [
        {
            context: '정각',
            template: (hour, name1) => ({
                question: `🕐 ${name1}이(가) 시계를 보고 있어요.\n긴 바늘이 12를, 짧은 바늘이 ${hour}을 가리키고 있어요.\n지금은 몇 시일까요?`,
                explanation: `긴 바늘이 12를 가리키면 정각이에요. 짧은 바늘이 ${hour}을 가리키므로 ${hour}시입니다!`,
                answer: `${hour}시`,
                wrongs: [`${hour + 1}시`, `${hour - 1 > 0 ? hour - 1 : 12}시`, `${hour}시 30분`]
            })
        },
        {
            context: '30분',
            template: (hour, name1) => ({
                question: `🕐 ${name1}이(가) 시계를 보고 있어요.\n긴 바늘이 6을, 짧은 바늘이 ${hour}과 ${hour + 1} 사이를 가리키고 있어요.\n지금은 몇 시 몇 분일까요?`,
                explanation: `긴 바늘이 6을 가리키면 30분이에요. 짧은 바늘이 ${hour}과 ${hour + 1} 사이이므로 ${hour}시 30분입니다!`,
                answer: `${hour}시 30분`,
                wrongs: [`${hour}시`, `${hour + 1}시`, `${hour}시 15분`]
            })
        }
    ],

    // 시간 계산 (2~3학년)
    timeCalculation: [
        {
            context: '시간 지남',
            template: (startHour, duration, endHour, name1) => ({
                question: `⏰ ${name1}이(가) ${startHour}시에 공부를 시작했어요.\n${duration}시간 동안 공부했다면, 끝난 시간은 몇 시일까요?`,
                explanation: `${startHour}시에서 ${duration}시간이 지나면 ${endHour}시입니다!`,
                answer: `${endHour}시`,
                wrongs: [`${endHour - 1}시`, `${endHour + 1}시`, `${startHour}시`]
            })
        },
        {
            context: '걸린 시간',
            template: (startHour, endHour, duration, name1) => ({
                question: `⏰ ${name1}이(가) ${startHour}시에 놀기 시작해서 ${endHour}시에 끝났어요.\n모두 몇 시간 동안 놀았을까요?`,
                explanation: `${endHour} - ${startHour} = ${duration}시간 동안 놀았어요!`,
                answer: `${duration}시간`,
                wrongs: [`${duration - 1}시간`, `${duration + 1}시간`, `${startHour}시간`]
            })
        }
    ],

    // 달력 읽기 (2~3학년)
    calendarReading: [
        {
            context: '요일 계산',
            template: (today, daysLater, resultDay) => ({
                question: `📅 오늘이 ${today}이에요.\n${daysLater}일 후는 무슨 요일일까요?`,
                explanation: `${today}에서 ${daysLater}일 후는 ${resultDay}입니다!`,
                answer: resultDay,
                wrongs: ['월요일', '수요일', '금요일', '일요일'].filter(d => d !== resultDay).slice(0, 3)
            })
        }
    ],

    // 길이 비교/측정 (1~2학년)
    lengthComparison: [
        {
            context: '길이 비교',
            template: (a, b, longer, shorter, name1, name2) => ({
                question: `📏 ${name1}의 연필은 ${a}cm, ${name2}의 연필은 ${b}cm예요.\n더 긴 연필은 몇 cm일까요?`,
                explanation: `${a}cm와 ${b}cm를 비교하면 ${longer}cm가 더 깁니다!`,
                answer: `${longer}cm`,
                wrongs: [`${shorter}cm`, `${a + b}cm`, `${Math.abs(a - b)}cm`]
            })
        }
    ]
};

// 시간/측정 문제 생성 함수
function generateMeasurementProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, createProblemResult, shuffleArray } = window.ProblemBase;

    const [name1, name2] = getTwoCharacters();

    // 난이도에 따른 유형 선택
    const type = Math.floor(Math.random() * 4);
    let result;

    if (type === 0) {
        // 시계 읽기 (정각)
        const hour = Math.floor(Math.random() * 12) + 1;
        const template = MEASUREMENT_TEMPLATES.clockReading[0];
        result = template.template(hour, name1);

    } else if (type === 1) {
        // 시계 읽기 (30분)
        const hour = Math.floor(Math.random() * 11) + 1;
        const template = MEASUREMENT_TEMPLATES.clockReading[1];
        result = template.template(hour, name1);

    } else if (type === 2) {
        // 시간 계산
        const startHour = Math.floor(Math.random() * 8) + 8; // 8시~15시
        const duration = Math.floor(Math.random() * 3) + 1;
        const endHour = startHour + duration;

        if (Math.random() < 0.5) {
            const template = MEASUREMENT_TEMPLATES.timeCalculation[0];
            result = template.template(startHour, duration, endHour, name1);
        } else {
            const template = MEASUREMENT_TEMPLATES.timeCalculation[1];
            result = template.template(startHour, endHour, duration, name1);
        }

    } else {
        // 길이 비교
        const a = Math.floor(Math.random() * 20) + 5;
        let b;
        do {
            b = Math.floor(Math.random() * 20) + 5;
        } while (a === b);
        const longer = Math.max(a, b);
        const shorter = Math.min(a, b);

        const template = MEASUREMENT_TEMPLATES.lengthComparison[0];
        result = template.template(a, b, longer, shorter, name1, name2);
    }

    return createProblemResult(result.question, result.answer, result.explanation, result.wrongs, 'measurement', difficulty);
}

// 전역으로 내보내기
window.MeasurementProblems = {
    TEMPLATES: MEASUREMENT_TEMPLATES,
    generate: generateMeasurementProblem
};
