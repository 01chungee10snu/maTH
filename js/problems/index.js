/* =========================================================================
   문제 모듈 통합 로더 - Problem Module Loader
   모든 문제 유형을 통합하고 단일 인터페이스 제공
   ========================================================================= */

// 문제 생성 통합 함수
function generateProblem(topic, difficulty) {
    // 기본 모듈 확인
    if (!window.ProblemBase) {
        console.error('ProblemBase 모듈이 로드되지 않았습니다.');
        return generateFallbackProblem(difficulty);
    }

    // 주제별 문제 생성
    if (topic.includes('덧셈') || topic.includes('합')) {
        return window.AdditionProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('뺄셈') || topic.includes('차')) {
        return window.SubtractionProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('곱셈') || topic.includes('구구')) {
        return window.MultiplicationProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('나눗셈') || topic.includes('나머지') || topic === 'division') {
        return window.DivisionProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('분수')) {
        return window.FractionProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('도형') || topic.includes('모양') || topic.includes('삼각형') || topic.includes('사각형')) {
        return window.GeometryProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('시계') || topic.includes('시각') || topic.includes('시간')) {
        return window.MeasurementProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('규칙') || topic.includes('수열')) {
        return window.PatternProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('길이')) {
        return window.LengthProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('자료') || topic.includes('그래프') || topic.includes('표') || topic.includes('분류')) {
        return window.GraphProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('수') && !topic.includes('수열')) {
        return window.NumberProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('창의') || topic.includes('영재') || topic.includes('사고력')) {
        return window.CreativeProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('들이') || topic.includes('용량') || topic.includes('mL') || topic.includes('L')) {
        return window.CapacityProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('무게') || topic.includes('kg') || topic.includes('g')) {
        return window.WeightProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }
    if (topic.includes('부피') || topic.includes('쌓기') || topic.includes('직육면체')) {
        return window.VolumeProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }

    // 높은 난이도에서 창의력 문제 확률적 출제
    if (difficulty >= 15 && Math.random() < 0.2) {
        return window.CreativeProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
    }

    // 기본값: 덧셈
    return window.AdditionProblems?.generate(difficulty) || generateFallbackProblem(difficulty);
}

// 폴백 문제 생성 (모듈 로드 실패 시)
function generateFallbackProblem(difficulty) {
    const a = Math.floor(Math.random() * (difficulty * 10)) + 1;
    const b = Math.floor(Math.random() * (difficulty * 10)) + 1;
    const answer = a + b;

    return {
        question: `🍬 사탕이 ${a}개 있었어요. ${b}개를 더 받았다면, 모두 몇 개일까요?`,
        options: [String(answer), String(answer + 1), String(answer - 1), String(answer + 5)].sort(() => Math.random() - 0.5),
        answer: String(answer),
        explanation: `${a} + ${b} = ${answer}개입니다.`,
        problemKey: `fallback-${Date.now()}`
    };
}

// 모듈 로드 상태 확인
function checkModulesLoaded() {
    const modules = [
        'ProblemBase',
        'AdditionProblems',
        'SubtractionProblems',
        'MultiplicationProblems',
        'DivisionProblems',
        'FractionProblems',
        'GeometryProblems',
        'MeasurementProblems',
        'PatternProblems',
        'LengthProblems',
        'GraphProblems',
        'NumberProblems',
        'CreativeProblems',
        'CapacityProblems',
        'WeightProblems',
        'VolumeProblems'
    ];

    const loaded = modules.filter(m => window[m]);
    const missing = modules.filter(m => !window[m]);

    console.log(`문제 모듈 로드 상태: ${loaded.length}/${modules.length}`);
    if (missing.length > 0) {
        console.warn('로드되지 않은 모듈:', missing.join(', '));
    }

    return {
        total: modules.length,
        loaded: loaded.length,
        missing: missing
    };
}

// 전역으로 내보내기
window.ProblemLoader = {
    generate: generateProblem,
    checkModules: checkModulesLoaded,
    generateFallback: generateFallbackProblem
};

// 초기 로드 확인
console.log('문제 모듈 로더가 초기화되었습니다.');
