# -*- coding: utf-8 -*-
"""
OCR 결과 보정 및 구조화 (확장 버전)
1. OCR 오인식 텍스트 수정 (확장된 사전)
2. 연결 관계 정제
3. 학년-단원-개념 계층 구조로 정리
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
import re
from collections import defaultdict

INPUT_FILE = "structured_data.json"
OUTPUT_FILE = "math_curriculum_structured.json"

# OCR 오인식 보정 사전 (확장)
OCR_CORRECTIONS = {
    # === 뺄셈 관련 ===
    "way": "뺄셈",
    "밸셈": "뺄셈",
    "밸": "뺄",
    "덧셈과뺄셈": "덧셈과 뺄셈",
    "ㆍ한자리수덧셈과뺄셈": "ㆍ한 자리 수의 덧셈과 뺄셈",
    "두자리수의덧셈과뺄셈": "ㆍ두 자리 수의 덧셈과 뺄셈",
    "두자리수의덧셈과밸셈": "ㆍ두 자리 수의 덧셈과 뺄셈",
    "덧셈과밸셈": "덧셈과 뺄셈",

    # === 순환소수 ===
    "환소수": "순환소수",
    "ㆍ유리수와환소수": "ㆍ유리수와 순환소수",
    "ㆍ유리수와순환소수": "ㆍ유리수와 순환소수",
    "ㆍ유리수와순순환소수": "ㆍ유리수와 순환소수",

    # === 자리수 관련 ===
    "세리수": "세 자리 수",
    "세자리수": "세 자리 수",
    "(il자리수)": "(한 자리 수)",
    "(Ul자수)": "(한 자리 수)",
    "(Thal리수)": "(한 자리 수)",
    "(한자리수)": "(한 자리 수)",
    "[두자리수)": "÷(두 자리 수)",
    "ㆍ세자수덧셈과": "ㆍ세 자리 수의 덧셈과",
    "ㆍ세자리수의 덧셈과뺄셈": "ㆍ세 자리 수의 덧셈과 뺄셈",
    "다섯자리상의수": "다섯 자리 이상의 수",
    "다섯자리 이상의 수": "다섯 자리 이상의 수",
    "ㆍ네자리수": "ㆍ네 자리 수",
    "두자리수의곱셈": "ㆍ두 자리 수의 곱셈",
    "(한자리수)*(두자리수)": "(한 자리 수)×(두 자리 수)",
    "자수+(두자수": "자리 수)÷(두 자리 수)",
    "ㆍ(한자수[한자수": "ㆍ(한 자리 수)×(한 자리 수)",

    # === 분수/소수 ===
    "*분수": "ㆍ분수",
    "ㆍ분수": "ㆍ분수",
    "ㆍ부모가같은분수의": "ㆍ분모가 같은 분수의 덧셈과 뺄셈",
    "ㆍ분모가같은분수의": "ㆍ분모가 같은 분수의 덧셈과 뺄셈",
    "ㆍ분모가 같은 분수의": "ㆍ분모가 같은 분수의 덧셈과 뺄셈",
    "ㆍ분모가다른분수의": "ㆍ분모가 다른 분수의 덧셈과 뺄셈",
    "ㆍ분모가 다른 분수의": "ㆍ분모가 다른 분수의 덧셈과 뺄셈",
    "분수의곱셈": "ㆍ분수의 곱셈",
    "분수의": "ㆍ분수의 나눗셈",
    "소수의덧셈과": "ㆍ소수의 덧셈과 뺄셈",
    "ㆍ소수의곱": "ㆍ소수의 곱셈",
    "소수": "소수",

    # === 계산 ===
    "혼계산": "혼합 계산",
    "ㆍ자연수의혼계산": "ㆍ자연수의 혼합 계산",
    "ㆍ자연수의혼합 계산": "ㆍ자연수의 혼합 계산",
    "ㆍ받받아내림이없": "ㆍ받아내림이 없는 뺄셈",
    "ㆍ받아내림이 없는": "ㆍ받아내림이 없는 뺄셈",
    "받아올림받아내림이없는": "ㆍ받아올림, 받아내림이 없는 덧셈과 뺄셈",
    "ㆍ셈구구": "ㆍ곱셈구구",

    # === 약수/배수 ===
    "ㆍ최대공약수와최소공배수": "ㆍ최대공약수와 최소공배수",
    "ㆍ최대공약수와 최소공배수": "ㆍ최대공약수와 최소공배수",
    "약수와배수": "ㆍ약수와 배수",
    "ㆍ약분과통": "ㆍ약분과 통분",
    "ㆍ약분과 통분": "ㆍ약분과 통분",

    # === 함수 ===
    "ㆍ지수와로고": "ㆍ지수와 로그",
    "ㆍ지수와 로그": "ㆍ지수와 로그",
    "ㆍ지수함수와로그함수": "ㆍ지수함수와 로그함수",
    "ㆍ지수함수와 로그함수": "ㆍ지수함수와 로그함수",
    "함수의극속": "ㆍ함수의 극한과 연속",
    "함수의 극한과 연속": "ㆍ함수의 극한과 연속",
    "ㆍ근호를포함한식의계": "ㆍ근호를 포함한 식의 계산",
    "ㆍ근호를 포함한 식의 계산": "ㆍ근호를 포함한 식의 계산",
    "ㆍ제곱근과실수": "ㆍ제곱근과 실수",
    "ㆍ제곱근과 실수": "ㆍ제곱근과 실수",
    "일차함수와그그래프": "ㆍ일차함수와 그 그래프",
    "ㆍ일차함수와일차방정식의": "ㆍ일차함수와 일차방정식의 관계",
    "삼각함수": "ㆍ삼각함수",

    # === 방정식 ===
    "인립일차방정식": "ㆍ연립일차방정식",
    "연립일차방정식": "ㆍ연립일차방정식",
    "ㆍ일차방정식": "ㆍ일차방정식",
    "복소수와이차방정식": "ㆍ복소수와 이차방정식",
    "복소수와 이차방정식": "ㆍ복소수와 이차방정식",
    "ㆍ여가방정식과부등식": "ㆍ여러 가지 방정식과 부등식",
    "ㆍ이차러방정지식과이차함": "ㆍ이차방정식과 이차함수",

    # === 도형 ===
    "ㆍ평면도형의성": "ㆍ평면도형의 성질",
    "ㆍ평면도형의 성질": "ㆍ평면도형의 성질",
    "ㆍ합동과대칭": "ㆍ합동과 대칭",
    "ㆍ합동과 대칭": "ㆍ합동과 대칭",
    "삼각형의성질": "ㆍ삼각형의 성질",
    "삼각형의 성질": "ㆍ삼각형의 성질",
    "ㆍ도형닮": "ㆍ도형의 닮음",
    "ㆍ도형의 닮음": "ㆍ도형의 닮음",
    "기본도형": "ㆍ기본 도형",
    "ㆍ평면도형의이통": "ㆍ평면도형의 이동",
    "|.면면도형의모양": "ㆍ평면도형의 모양",
    "ㆍ평도형의모양": "ㆍ평면도형의 모양",
    "ㆍ평평도형과과그그구구성성요소": "ㆍ평면도형과 그 구성 요소",
    "ㆍ입도형의모": "ㆍ입체도형의 모양",
    "ㆍ선반직선직": "ㆍ선분, 반직선, 직선",
    "삼각형": "ㆍ삼각형",
    "사각형": "ㆍ사각형",
    "정사각형_": "ㆍ정사각형",
    "ㆍ원구성요": "ㆍ원의 구성 요소",
    "ㆍ직육면체의부피겉넓이": "ㆍ직육면체의 부피와 겉넓이",
    "직육면체": "ㆍ직육면체",
    "＊원원의넓넓": "ㆍ원의 넓이",
    "둘레넓": "ㆍ둘레와 넓이",
    "도형의": "ㆍ도형의 넓이",

    # === 통계/확률 ===
    "도수본포와상대도수": "ㆍ도수분포와 상대도수",
    "도수분포와상대도수ㅣ": "ㆍ도수분포와 상대도수",
    ">|ㆍ겸우의수": "ㆍ경우의 수",
    "ㆍ경우의 수": "ㆍ경우의 수",
    "ㆍ확률": "ㆍ확률",
    "확률분포": "ㆍ확률분포",
    "순열과조합": "ㆍ순열과 조합",
    "평균": "ㆍ평균",
    "표그래": "ㆍ표와 그래프",
    "ㆍ막대그래프": "ㆍ막대그래프",
    "_ㆍ그림그래프": "ㆍ그림그래프",
    "ㆍ띠그래프": "ㆍ띠그래프",
    "원그래프": "ㆍ원그래프",
    ">!ㆍ대롯값": "ㆍ대푯값",
    "삼자그림과산점": "ㆍ산점도와 상관관계",

    # === 어림/측정 ===
    "버림,반돌림)": "ㆍ버림, 반올림",
    "버림, 반올림)": "ㆍ버림, 반올림",
    "어림하기": "ㆍ어림하기",
    "아림,": "ㆍ어림",
    "ㆍ길이의무게,넓": "ㆍ길이, 무게, 넓이",
    "길0": "ㆍ길이",
    "길이의합과차": "ㆍ길이의 합과 차",
    "ㆍ각각합차": "ㆍ각도의 합과 차",
    "0/9]합차": "ㆍ들이의 합과 차",
    ",ㆍ시간(초),": "ㆍ시간(초)",
    "합과차": "ㆍ합과 차",
    "ㆍ시계(몇AL,몇시30분)": "ㆍ시계 보기 (몇 시, 몇 시 30분)",
    "ㆍ시,각과,시,간(분": "ㆍ시각과 시간 (분)",

    # === 미적분 ===
    "미분계수": "ㆍ미분계수",
    "ㆍ여러가지미분법": "ㆍ여러 가지 미분법",
    "ㆍ여러 가지 미분법": "ㆍ여러 가지 미분법",
    "여러가지함수의적분법": "ㆍ여러 가지 함수의 적분법",
    "여러 가지 함수의 적분법": "ㆍ여러 가지 함수의 적분법",
    ">)여가함수의미": "ㆍ여러 가지 함수의 미분",
    "ㆍ정적분": "ㆍ정적분",
    "정적분~": "ㆍ정적분",
    "ㆍ정적분의활": "ㆍ정적분의 활용",
    "치ㆍ적분의용": "ㆍ치환적분과 부분적분",
    "ㆍ사인법칙과코사인법칙": "ㆍ사인법칙과 코사인법칙",
    "ㆍ사인법칙과 코사인법칙": "ㆍ사인법칙과 코사인법칙",
    "미적분|": "미적분 I",

    # === 수열 ===
    "차수열과등비수열": "ㆍ등차수열과 등비수열",
    ",수열의합": "ㆍ수열의 합",
    ".수열의": "ㆍ수열의 합",
    "수열의 합": "ㆍ수열의 합",
    "귀납법": "ㆍ수학적 귀납법",
    "수학적 귀납법": "ㆍ수학적 귀납법",
    "수의한": "ㆍ수열의 극한",

    # === 벡터/기하 ===
    "ㆍ벡터의성분과내적": "ㆍ벡터의 성분과 내적",
    "ㆍ벡터의 성분과 내적": "ㆍ벡터의 성분과 내적",
    "이차곡선고": "ㆍ이차곡선",
    "평면좌표": "ㆍ평면좌표",
    "좌표와그래프": "ㆍ좌표와 그래프",
    "ㆍ직선의방": "ㆍ직선의 방정식",
    "<ㆍ원의의방정식동": "ㆍ원의 방정식",

    # === 규칙/관계 ===
    "ㆍ물체,무늬,수의규찾": "ㆍ물체, 무늬, 수의 규칙 찾기",
    "ㆍ덧셈러": "ㆍ덧셈표에서 규칙 찾기",
    "여모양규찾": "ㆍ여러 가지 모양에서 규칙 찾기",
    "에서칙기": "에서 규칙 찾기",
    "계산식에서규찾": "ㆍ계산식에서 규칙 찾기",
    "ㆍ수도형의배칙": "ㆍ수와 도형의 배열에서 규칙 찾기",
    "ㆍ규칙과대": "ㆍ규칙과 대응",
    "ㆍ비례식과비례배분": "ㆍ비례식과 비례배분",
    "수의범위": "ㆍ수의 범위",
    "일일어능": "ㆍ일어날 수 있는 경우",

    # === 식/다항식 ===
    "ㆍ정수와유리수": "ㆍ정수와 유리수",
    "ㆍ정수와 유리수": "ㆍ정수와 유리수",
    "소인수분해": "ㆍ소인수분해",
    "ㆍ식의곱셈과인수분해": "ㆍ식의 곱셈과 인수분해",
    "ㆍ인수분": "ㆍ인수분해",
    "ㆍ항식의연": "ㆍ다항식의 연산",
    "나머지정리": "ㆍ나머지 정리",
    "자의용과식": "ㆍ문자의 사용과 식",
    "ㆍ문사": "ㆍ문자와 식",
    "집제합": "ㆍ집합",

    # === 기타 보정 ===
    "수와": "수와 연산",
    "연산": "",
    "변화와": "변화와 관계",
    "관계": "",
    "곱셈": "ㆍ곱셈",
    "들비교": "ㆍ들이 비교",
    "로기": "ㆍ쌓기나무",
    "ㆍ여가모으쌓": "ㆍ여러 가지 모양으로 쌓기",
    "러지": "ㆍ여러 가지 모양",
    "도형이": "ㆍ도형의 이동",
    "의음": "ㆍ닮음",
    "ㆍ정활": "ㆍ정적분의 활용",
    "정식": "ㆍ방정식",
    "ㆍ학적": "ㆍ수학적 귀납법",
    "ㆍ확건률의개념과": "ㆍ확률의 개념",
    "조부확륨": "ㆍ조건부확률",
    "ㆍ계적": "ㆍ통계적 추정",
    "ㆍ통추": "ㆍ통계적 추정",
    "＊함이법칙관곱=이법칙": "ㆍ합의 법칙과 곱의 법칙",
    "행렬과그연산": "ㆍ행렬과 그 연산",

    # === 2022 개정 교육과정 신규/보완 항목 ===
    "공간벡터": "ㆍ공간벡터",
    "ㆍ공간벡터": "ㆍ공간벡터",
    "평면벡터": "ㆍ평면벡터",
    "ㆍ평면벡터": "ㆍ평면벡터",
    "공통수학": "공통수학",
    "공통수학1": "공통수학1",
    "공통수학2": "공통수학2",
    "피타고라스": "ㆍ피타고라스 정리",
    "ㆍ피타고라스": "ㆍ피타고라스 정리",
    "피타고라스정리": "ㆍ피타고라스 정리",
    "삼각비": "ㆍ삼각비",
    "ㆍ삼각비": "ㆍ삼각비",
    "원의성질": "ㆍ원의 성질",
    "ㆍ원의성질": "ㆍ원의 성질",
    "정비례와반비례": "ㆍ정비례와 반비례",
    "ㆍ정비례와반비례": "ㆍ정비례와 반비례",
    "이항정리": "ㆍ이항정리",
    "ㆍ이항정리": "ㆍ이항정리",
    "부정적분": "ㆍ부정적분",
    "ㆍ부정적분": "ㆍ부정적분",
    "등차수열과등비수열": "ㆍ등차수열과 등비수열",
    "ㆍ등차수열과등비수열": "ㆍ등차수열과 등비수열",
    "무리수": "ㆍ무리수",
    "ㆍ무리수": "ㆍ무리수",
    "이차함수와그래프": "ㆍ이차함수와 그 그래프",
    "ㆍ이차함수와그래프": "ㆍ이차함수와 그 그래프",
    "이차함수와 그 그래프": "ㆍ이차함수와 그 그래프",
    "일차부등식": "ㆍ일차부등식",
    "ㆍ일차부등식": "ㆍ일차부등식",
    "도함수": "ㆍ도함수",
    "ㆍ도함수": "ㆍ도함수",
    "도함수의활용": "ㆍ도함수의 활용",
    "ㆍ도함수의활용": "ㆍ도함수의 활용",

    # === 추가 OCR 보정 ===
    "ㆍ다항식의덧셈과뺄셈": "ㆍ다항식의 덧셈과 뺄셈",
    "다항식의곱셈과나눗셈": "ㆍ다항식의 곱셈과 나눗셈",
    "ㆍ인수분해": "ㆍ인수분해",
    "인수분해": "ㆍ인수분해",
    "곱셈공식": "ㆍ곱셈공식",
    "ㆍ곱셈공식": "ㆍ곱셈공식",
    "항등식": "ㆍ항등식",
    "ㆍ항등식": "ㆍ항등식",
    "나머지정리와인수정리": "ㆍ나머지 정리와 인수정리",
    "근과계수의관계": "ㆍ근과 계수의 관계",
    "ㆍ근과계수의관계": "ㆍ근과 계수의 관계",
    "삼각함수의덧셈정리": "ㆍ삼각함수의 덧셈정리",
    "ㆍ삼각함수의덧셈정리": "ㆍ삼각함수의 덧셈정리",

    # === 추가 OCR 보정 (중복 패턴 제거) ===
    "방ㆍ방정식": "방정식",
    "방ㆍ방ㆍ방정식": "방정식",
    "ㆍ방정식": "ㆍ방정식",
    "ㆍ분수의 나눗셈ㆍ곱셈": "ㆍ분수의 곱셈과 나눗셈",
    "ㆍ분수의 나눗셈덧셈과 뺄셈": "덧셈과 뺄셈",
    "ㆍ소ㆍ인수분해": "ㆍ소인수분해",
    "ㆍ곱셈과 ㆍ인수분해": "곱셈과 인수분해",
    "복소수와 이차방ㆍ방정식": "ㆍ복소수와 이차방정식",
    "이차방ㆍ방정식과 이차함수": "ㆍ이차방정식과 이차함수",
    "일차방ㆍ방정식의": "일차방정식의 관계",
    "연립일차방ㆍ방정식": "ㆍ연립일차방정식",
    "방ㆍ방정식과 부등식": "방정식과 부등식",
    "ㆍ식의 ㆍ곱셈과 ㆍ인수분해": "ㆍ식의 곱셈과 인수분해",
    "ㆍ행렬과 그": "ㆍ행렬과 그 연산",
    "ㆍ직선의 방ㆍ방ㆍ방정식": "ㆍ직선의 방정식",
    "ㆍ원의 방ㆍ방정식": "ㆍ원의 방정식",
    "ㆍ도형의 넓이이동": "ㆍ도형의 이동",
    "ㆍ평면ㆍ도형의 넓이모양": "ㆍ평면도형의 모양",
    "ㆍ입체ㆍ도형의 넓이모양": "ㆍ입체도형의 모양",
    "ㆍ평면ㆍ도형의 넓이이동": "ㆍ평면도형의 이동",
    "ㆍ두 자리 수의 ㆍ곱셈": "ㆍ두 자리 수의 곱셈",
    "ㆍ정ㆍ사각형": "ㆍ정사각형",
    "ㆍ산점도와 상관": "ㆍ산점도와 상관관계",
    "ㆍ미적분 I": "미적분 I",

    # === 마지막 수정 사항 ===
    "。": "",
    "。\"": "",
    "ㆍ。\"ㆍ길이": "ㆍ길이",
    "ㆍ행렬과 그": "ㆍ행렬과 그 연산",
    "ㆍ산점도와 상관": "ㆍ산점도와 상관관계",
    "ㆍ일차함수와 일차방정식의": "ㆍ일차함수와 일차방정식의 관계",
    "ㆍ(한 자리 수[한자수": "ㆍ(한 자리 수)×(한 자리 수)",
    "ㆍ분모가 같은 ㆍ분수의": "ㆍ분모가 같은 분수의 덧셈과 뺄셈",
    "ㆍ분모가 다른 ㆍ분수의": "ㆍ분모가 다른 분수의 덧셈과 뺄셈",
    "도수분포와 상대도수ㅣ": "ㆍ도수분포와 상대도수",
    "ㆍ도수분포와 상대도수ㅣ": "ㆍ도수분포와 상대도수",
    "ㆍ길 무게, 넓이": "ㆍ길이, 무게, 넓이",
    "ㆍ선 반직선, 직선": "ㆍ선분, 반직선, 직선",
    "ㆍ원의 구성": "ㆍ원의 구성 요소",

    # === 노이즈 완전 제거 ===
    "1학": "",
    "700": "",
    "Il": "",
    "II": "",
    "||": "",
    ">ㆍ": "",
    ">|ㆍ": "",
    ">|": "",
    "|ㆍ": "",
    "70000": "",
    "리의": "",
    "리)": "",
    ")×": "",
    "의산": "",
    "식계": "",
    "aa": "",
    "fee": "",
    "ah": "",
    "ef": "",
    "[-]": "",
    "=.": "",
    "ken)": "",
    "+HIgh": "",
    "28": "",
    "5!+": "",
    "에=": "",
    "열,": "",
    "요소": "",
    "분,": "",
    ",선": "",
    "ㆍ각": "",
    "이,": "",
    "보기": "",
    "하기": "",
    "칙기": "",
    "기,": "",
    "도,도의과": "",
    "함연": "",
    "ㆍ정활": "",
    ">)": "",
    "~ㆍ": "",
    "~ㆍ이항": "ㆍ이항정리",
    "3비": "",
    "비서": "",
    "ease": "",
    "ㆍ면도": "",
    "겨시대비": "",
    "시비": "",
    "경대교": "",
    "AC": "",
    "al": "",
    "(주에듀": "",
    "2022WS교육과정적용시기": "",
    "202541": "",
    "202641": "",
    "202741": "",
    "2024년": "",
    "25st!": "",
    "],2학년": "",
    "3,4학년": "",
    "5,6학년": "",
    "중학교": "",
    "고등학교": "",
    "ㅣ학년": "",
    "2학년": "",
    "수속학계통도(에듀왕)": "",
    "320000": "",
    "039301": "",
    "0000": "",
    "단계별학기용교": "",
    "초등16단계연교재": "",
    "와이": "",
    "의이": "",
    "날가성": "",
    "와스하ax즈": "",
    "왕수학": "",
    "029992": "",
    "G5)KMA": "",
    "절`대강자": "",
    "개념연산": "",
    "Wa유형": "",
    "KMA한국수학학력평가대문제": "",
    "일주월년": "",
    "ㆍ분류와": "",
}

# 수학 교육 계통도 영역 정의 (2022 개정 교육과정 기준)
MATH_DOMAINS = {
    "수와 연산": {
        "keywords": ["수", "자리", "덧셈", "뺄셈", "곱셈", "나눗셈", "분수", "소수", "약수", "배수",
                    "소인수", "정수", "유리수", "제곱근", "실수", "근호", "복소수", "지수", "로그",
                    "자연수", "어림", "버림", "반올림", "올림", "순환소수", "무리수"],
        "order": 1
    },
    "변화와 관계": {
        "keywords": ["규칙", "비", "비례", "함수", "방정식", "부등식", "좌표", "그래프", "대응",
                    "일차함수", "이차함수", "삼각함수", "지수함수", "로그함수", "연립방정식",
                    "연립부등식", "이차방정식", "집합", "명제"],
        "order": 2
    },
    "도형과 측정": {
        "keywords": ["도형", "삼각형", "사각형", "원", "각", "넓이", "부피", "둘레", "길이",
                    "합동", "대칭", "닮음", "직선", "평면", "입체", "벡터", "직육면체", "쌓기",
                    "피타고라스", "삼각비", "원주율", "공간도형", "좌표평면", "원의 방정식",
                    "이차곡선", "공간벡터", "행렬"],
        "order": 3
    },
    "자료와 가능성": {
        "keywords": ["그래프", "표", "평균", "확률", "통계", "도수", "분포", "경우의 수", "대푯값", "산점도",
                    "순열", "조합", "이항분포", "정규분포", "확률분포", "조건부확률", "상관관계"],
        "order": 4
    },
    "해석(미적분)": {
        "keywords": ["극한", "미분", "적분", "연속", "수열", "등차수열", "등비수열", "급수",
                    "도함수", "미분계수", "정적분", "부정적분", "치환적분", "부분적분"],
        "order": 5
    }
}

# 2022 개정 교육과정 고등학교 과목 구성
HIGH_SCHOOL_SUBJECTS = {
    "공통수학1": {
        "topics": ["다항식", "방정식과 부등식", "행렬", "경우의 수"],
        "order": 1
    },
    "공통수학2": {
        "topics": ["도형의 방정식", "집합과 명제", "함수"],
        "order": 2
    },
    "대수": {
        "topics": ["지수와 로그", "지수함수와 로그함수", "삼각함수"],
        "order": 3
    },
    "미적분I": {
        "topics": ["수열의 극한", "함수의 극한과 연속", "미분", "적분"],
        "order": 4
    },
    "확률과통계": {
        "topics": ["순열과 조합", "확률", "통계"],
        "order": 5
    },
    "미적분II": {
        "topics": ["여러 가지 함수의 미분", "여러 가지 함수의 적분", "미분방정식"],
        "order": 6
    },
    "기하": {
        "topics": ["이차곡선", "평면벡터", "공간도형과 공간좌표", "공간벡터"],
        "order": 7
    }
}

# 중학교 학년별 내용 체계 (2022 개정 교육과정)
MIDDLE_SCHOOL_CURRICULUM = {
    "중1": {
        "수와 연산": ["소인수분해", "최대공약수와 최소공배수", "정수와 유리수", "유리수의 사칙연산"],
        "문자와 식": ["문자의 사용", "일차식의 계산", "일차방정식"],
        "함수": ["좌표평면과 그래프", "정비례와 반비례"],
        "기하": ["기본 도형", "평면도형의 성질", "입체도형의 성질"],
        "확률과 통계": ["자료의 정리와 해석"]
    },
    "중2": {
        "수와 연산": ["유리수와 순환소수"],
        "문자와 식": ["식의 계산", "일차부등식", "연립일차방정식"],
        "함수": ["일차함수와 그 그래프", "일차함수와 일차방정식의 관계"],
        "기하": ["삼각형의 성질", "사각형의 성질", "도형의 닮음"],
        "확률과 통계": ["경우의 수", "확률"]
    },
    "중3": {
        "수와 연산": ["제곱근과 실수", "근호를 포함한 식의 계산"],
        "문자와 식": ["다항식의 곱셈과 인수분해", "이차방정식"],
        "함수": ["이차함수와 그 그래프"],
        "기하": ["피타고라스 정리", "삼각비", "원의 성질"],
        "확률과 통계": ["대푯값과 산포도", "상관관계"]
    }
}

# 학년별 구분
GRADE_LEVELS = {
    "elementary_1_2": {"name": "초등 1-2학년", "order": 1},
    "elementary_3_4": {"name": "초등 3-4학년", "order": 2},
    "elementary_5_6": {"name": "초등 5-6학년", "order": 3},
    "middle_school": {"name": "중학교", "order": 4},
    "high_school": {"name": "고등학교", "order": 5}
}

def correct_text(text):
    """OCR 오인식 텍스트 보정"""
    corrected = text

    # 정확한 매칭 먼저 시도
    if corrected in OCR_CORRECTIONS:
        result = OCR_CORRECTIONS[corrected]
        if result:
            return result

    # 긴 패턴부터 매칭 (길이 순 정렬)
    sorted_corrections = sorted(OCR_CORRECTIONS.items(), key=lambda x: len(x[0]), reverse=True)

    for wrong, right in sorted_corrections:
        if wrong in corrected:
            corrected = corrected.replace(wrong, right)

    # 공백 정리
    corrected = re.sub(r'\s+', ' ', corrected).strip()

    # 연속된 ㆍ 제거
    corrected = re.sub(r'ㆍ+', 'ㆍ', corrected)

    # 중복 단어 제거 (예: "뺄셈 뺄셈" -> "뺄셈")
    words = corrected.split()
    unique_words = []
    for word in words:
        if not unique_words or word != unique_words[-1]:
            unique_words.append(word)
    corrected = ' '.join(unique_words)

    # 중복 패턴 제거 (예: "순순환소수" -> "순환소수")
    corrected = re.sub(r'(순)+환소수', '순환소수', corrected)
    corrected = re.sub(r'(방ㆍ)+방정식', '방정식', corrected)
    corrected = re.sub(r'(방)+정식', '방정식', corrected)
    corrected = re.sub(r'(뺄셈\s*)+', '뺄셈', corrected)
    corrected = re.sub(r'(덧셈과\s*뺄셈\s*)+', '덧셈과 뺄셈', corrected)
    corrected = re.sub(r'(나눗셈\s*)+', '나눗셈', corrected)
    corrected = re.sub(r'(넓이\s*)+', '넓이', corrected)
    corrected = re.sub(r'(해)+$', '해', corrected)

    # 단어 중간의 ㆍ 제거 (예: "ㆍ소ㆍ인수분해" -> "ㆍ소인수분해")
    corrected = re.sub(r'소ㆍ인수분해', '소인수분해', corrected)
    corrected = re.sub(r'정ㆍ사각형', '정사각형', corrected)
    corrected = re.sub(r'평면ㆍ도형', '평면도형', corrected)
    corrected = re.sub(r'입체ㆍ도형', '입체도형', corrected)
    corrected = re.sub(r'분수의 나눗셈ㆍ곱셈', '분수의 곱셈과 나눗셈', corrected)
    corrected = re.sub(r'의 ㆍ곱셈', '의 곱셈', corrected)
    corrected = re.sub(r'의 ㆍ분수', '의 분수', corrected)
    corrected = re.sub(r'넓이모양', '모양', corrected)
    corrected = re.sub(r'넓이이동', '이동', corrected)
    corrected = re.sub(r'나눗셈덧셈과', '덧셈과', corrected)
    corrected = re.sub(r'곱셈과 ㆍ인수분해', '곱셈과 인수분해', corrected)
    corrected = re.sub(r'ㆍ+', 'ㆍ', corrected)  # 중복 ㆍ 제거
    corrected = re.sub(r'ㆍ\s+', 'ㆍ', corrected)  # ㆍ 뒤 공백 제거

    # 앞뒤 특수문자 정리
    corrected = re.sub(r'^[·\-\s>|<]+', '', corrected)
    corrected = re.sub(r'[·\-\s>|<]+$', '', corrected)

    # ㆍ로 시작하지 않는 경우 추가 (개념 항목)
    if corrected and not corrected.startswith('ㆍ') and len(corrected) > 2:
        if any(keyword in corrected for domain in MATH_DOMAINS.values() for keyword in domain["keywords"]):
            corrected = 'ㆍ' + corrected

    return corrected

def classify_domain(text):
    """텍스트를 수학 영역으로 분류"""
    text_lower = text.lower()

    for domain, info in MATH_DOMAINS.items():
        for keyword in info["keywords"]:
            if keyword in text_lower:
                return domain

    return None  # 분류 불가능한 경우 None 반환

def filter_meaningful_text(text):
    """의미있는 텍스트인지 판별"""
    # 빈 텍스트 제외
    if not text or not text.strip():
        return False

    # 너무 짧은 텍스트 제외
    if len(text) < 3:
        return False

    # 숫자만 있는 경우 제외
    if text.replace(' ', '').isdigit():
        return False

    # 특수문자만 있는 경우 제외
    if re.match(r'^[\W\d\s]+$', text.replace('ㆍ', '')):
        return False

    # 노이즈로 판단되는 패턴 제외
    noise_patterns = [
        r'^[a-zA-Z]{1,4}$',  # 짧은 영문
        r'^\d+$',  # 숫자만
        r'^[\(\)\[\]\{\}]+$',  # 괄호만
        r'^[ㅣㅡ\-_\s]+$',  # 선 문자만
        r'^ㆍ$',  # ㆍ만
        r'^\s*$',  # 공백만
    ]

    for pattern in noise_patterns:
        if re.match(pattern, text):
            return False

    # 수학 관련 키워드가 하나도 없는 경우 제외
    has_math_keyword = False
    for domain in MATH_DOMAINS.values():
        for keyword in domain["keywords"]:
            if keyword in text:
                has_math_keyword = True
                break
        if has_math_keyword:
            break

    # 키워드가 없어도 ㆍ로 시작하고 한글이 3자 이상이면 유지
    korean_chars = re.findall(r'[가-힣]', text)
    if not has_math_keyword and len(korean_chars) < 3:
        return False

    return True

def refine_connections(connections, texts):
    """연결 관계 정제"""
    valid_texts = set(t["text"] for t in texts if filter_meaningful_text(t["text"]))

    refined = []
    seen = set()

    for conn in connections:
        from_texts = []
        to_texts = []

        for t in conn["from"]:
            corrected = correct_text(t)
            if corrected and filter_meaningful_text(corrected):
                from_texts.append(corrected)

        for t in conn["to"]:
            corrected = correct_text(t)
            if corrected and filter_meaningful_text(corrected):
                to_texts.append(corrected)

        # 중복 제거
        from_texts = list(set(from_texts))
        to_texts = list(set(to_texts))

        # 빈 연결 제외
        if not from_texts or not to_texts:
            continue

        # 자기 자신 연결 제외
        if set(from_texts) == set(to_texts):
            continue

        # 동일 항목 연결 제외 (from과 to가 겹치는 경우)
        from_set = set(from_texts)
        to_set = set(to_texts)
        if from_set & to_set:  # 교집합이 있으면
            from_texts = list(from_set - to_set) or from_texts[:1]
            to_texts = list(to_set - from_set) or to_texts[:1]

        if not from_texts or not to_texts:
            continue

        # 중복 제외
        key = (tuple(sorted(from_texts)), tuple(sorted(to_texts)))
        reverse_key = (tuple(sorted(to_texts)), tuple(sorted(from_texts)))
        if key in seen or reverse_key in seen:
            continue
        seen.add(key)

        refined.append({
            "from": from_texts,
            "to": to_texts
        })

    return refined

def build_curriculum_structure(categorized_data):
    """학년-단원-개념 계층 구조 생성"""
    curriculum = {}

    for area_key, items in categorized_data.items():
        if area_key == "header":
            continue

        grade_info = GRADE_LEVELS.get(area_key, {"name": area_key, "order": 99})
        grade_name = grade_info["name"]

        # 영역별로 개념 분류
        domains = defaultdict(list)

        for item in items:
            text = correct_text(item["text"])

            if not filter_meaningful_text(text):
                continue

            domain = classify_domain(text)
            if domain:  # 분류 가능한 경우만 추가
                # 중복 체크
                existing = [c["concept"] for c in domains[domain]]
                if text not in existing:
                    domains[domain].append({
                        "concept": text,
                        "coords": item["coords"]
                    })

        # 비어있지 않은 영역만 포함
        non_empty_domains = {k: v for k, v in domains.items() if v}

        curriculum[grade_name] = {
            "order": grade_info["order"],
            "domains": non_empty_domains
        }

    return curriculum

def create_concept_graph(connections):
    """개념 연결 그래프 생성"""
    graph = defaultdict(lambda: {"prerequisites": set(), "leads_to": set()})

    for conn in connections:
        for from_text in conn["from"]:
            for to_text in conn["to"]:
                if from_text != to_text:
                    graph[from_text]["leads_to"].add(to_text)
                    graph[to_text]["prerequisites"].add(from_text)

    # set을 list로 변환
    result = {}
    for concept, links in graph.items():
        result[concept] = {
            "prerequisites": sorted(list(links["prerequisites"])),
            "leads_to": sorted(list(links["leads_to"]))
        }

    return result

def main():
    print("=" * 60)
    print("1단계: 데이터 로드")
    print("=" * 60)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"텍스트 항목: {len(data['texts'])}개")
    print(f"연결 관계: {len(data['connections'])}개")

    print("\n" + "=" * 60)
    print("2단계: OCR 오인식 보정")
    print("=" * 60)

    corrected_texts = []
    for item in data['texts']:
        corrected = correct_text(item['text'])
        if filter_meaningful_text(corrected):
            corrected_texts.append({
                "text": corrected,
                "original": item['text'],
                "pdf_coords": item['pdf_coords'],
                "confidence": item['confidence']
            })

    # 중복 제거
    seen_texts = set()
    unique_texts = []
    for item in corrected_texts:
        if item['text'] not in seen_texts:
            seen_texts.add(item['text'])
            unique_texts.append(item)

    print(f"보정 후 유효 텍스트: {len(unique_texts)}개")

    # 보정 예시 출력
    print("\n--- 보정 예시 ---")
    corrections_shown = 0
    for item in corrected_texts:
        if item['text'] != item['original'] and item['text']:
            print(f"  '{item['original']}' → '{item['text']}'")
            corrections_shown += 1
            if corrections_shown >= 20:
                break

    print("\n" + "=" * 60)
    print("3단계: 연결 관계 정제")
    print("=" * 60)

    refined_connections = refine_connections(data['connections'], unique_texts)
    print(f"정제 후 연결 관계: {len(refined_connections)}개")

    print("\n--- 정제된 연결 관계 샘플 ---")
    for i, conn in enumerate(refined_connections[:25]):
        print(f"  [{i+1}] {conn['from']} → {conn['to']}")

    print("\n" + "=" * 60)
    print("4단계: 교육과정 구조 생성")
    print("=" * 60)

    # categorized 데이터도 보정
    corrected_categorized = {}
    for area, items in data['categorized'].items():
        corrected_items = []
        seen = set()
        for item in items:
            corrected = correct_text(item['text'])
            if filter_meaningful_text(corrected) and corrected not in seen:
                seen.add(corrected)
                corrected_items.append({
                    "text": corrected,
                    "coords": item['coords']
                })
        corrected_categorized[area] = corrected_items

    curriculum = build_curriculum_structure(corrected_categorized)

    for grade, info in sorted(curriculum.items(), key=lambda x: x[1]['order']):
        print(f"\n■ {grade}")
        for domain in sorted(info['domains'].keys(), key=lambda d: MATH_DOMAINS.get(d, {}).get('order', 99)):
            concepts = info['domains'][domain]
            concept_names = [c['concept'] for c in concepts]
            print(f"  ▶ {domain} ({len(concepts)}개)")
            for name in concept_names[:10]:
                print(f"    - {name}")
            if len(concept_names) > 10:
                print(f"    ... 외 {len(concept_names)-10}개")

    print("\n" + "=" * 60)
    print("5단계: 개념 연결 그래프 생성")
    print("=" * 60)

    concept_graph = create_concept_graph(refined_connections)
    print(f"그래프 노드 수: {len(concept_graph)}개")

    # 연결이 많은 핵심 개념 찾기
    key_concepts = sorted(
        concept_graph.items(),
        key=lambda x: len(x[1]['prerequisites']) + len(x[1]['leads_to']),
        reverse=True
    )[:15]

    print("\n--- 핵심 개념 (연결이 많은 순) ---")
    for concept, links in key_concepts:
        total = len(links['prerequisites']) + len(links['leads_to'])
        print(f"\n  '{concept}' (연결: {total}개)")
        if links['prerequisites']:
            print(f"    ← 선수: {links['prerequisites'][:3]}")
        if links['leads_to']:
            print(f"    → 후속: {links['leads_to'][:3]}")

    # 최종 결과 저장
    output_data = {
        "metadata": {
            "source": "2024 에듀왕 수학계통도.pdf",
            "curriculum_standard": "2022 개정 교육과정",
            "total_concepts": len(unique_texts),
            "total_connections": len(refined_connections)
        },
        "texts": unique_texts,
        "connections": refined_connections,
        "curriculum": curriculum,
        "concept_graph": concept_graph,
        "reference": {
            "high_school_subjects": HIGH_SCHOOL_SUBJECTS,
            "middle_school_curriculum": MIDDLE_SCHOOL_CURRICULUM,
            "math_domains": {k: v["keywords"] for k, v in MATH_DOMAINS.items()}
        }
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n\n결과 저장 완료: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
