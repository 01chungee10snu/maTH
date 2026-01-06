# -*- coding: utf-8 -*-
"""
PDF를 이미지로 변환 후 Tesseract CLI로 직접 텍스트 및 위치 추출
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import fitz  # PyMuPDF
import subprocess
import json
from collections import defaultdict

PDF_PATH = "2024 에듀왕 수학계통도.pdf"
OUTPUT_IMAGE = "계통도_page1.png"
OUTPUT_JSON = "ocr_results.json"
TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def pdf_to_image(pdf_path, page_num=0, dpi=300):
    """PDF 페이지를 고해상도 이미지로 변환"""
    doc = fitz.open(pdf_path)
    page = doc[page_num]

    # DPI 설정 (기본 72 -> 300으로 확대)
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    # 페이지를 픽스맵으로 렌더링
    pix = page.get_pixmap(matrix=matrix)

    # PNG로 저장
    pix.save(OUTPUT_IMAGE)

    doc.close()
    return zoom, pix.width, pix.height

def run_tesseract_tsv(image_path):
    """Tesseract CLI로 TSV 형식의 상세 결과 추출"""
    result = subprocess.run(
        [TESSERACT_CMD, image_path, 'stdout', '-l', 'kor+eng', 'tsv'],
        capture_output=True,
        text=True,
        encoding='utf-8'
    )
    return result.stdout

def parse_tsv(tsv_data, zoom_factor):
    """TSV 데이터를 파싱하여 구조화"""
    lines = tsv_data.strip().split('\n')
    if len(lines) < 2:
        return []

    headers = lines[0].split('\t')
    results = []

    for line in lines[1:]:
        values = line.split('\t')
        if len(values) < len(headers):
            continue

        row = dict(zip(headers, values))

        text = row.get('text', '').strip()
        conf = int(float(row.get('conf', -1)))

        if text and conf > 0:
            item = {
                "text": text,
                "confidence": conf,
                "bbox": {
                    "x": int(row.get('left', 0)),
                    "y": int(row.get('top', 0)),
                    "width": int(row.get('width', 0)),
                    "height": int(row.get('height', 0))
                },
                "pdf_coords": {
                    "x": int(row.get('left', 0)) / zoom_factor,
                    "y": int(row.get('top', 0)) / zoom_factor,
                    "width": int(row.get('width', 0)) / zoom_factor,
                    "height": int(row.get('height', 0)) / zoom_factor
                },
                "level": int(row.get('level', 0)),
                "block_num": int(row.get('block_num', 0)),
                "line_num": int(row.get('line_num', 0))
            }
            results.append(item)

    return results

def main():
    print("=" * 60)
    print("1단계: PDF를 고해상도 이미지로 변환")
    print("=" * 60)

    zoom_factor, width, height = pdf_to_image(PDF_PATH, dpi=300)
    print(f"이미지 저장 완료: {OUTPUT_IMAGE}")
    print(f"이미지 크기: {width} x {height}")
    print(f"확대 비율: {zoom_factor}x")

    print("\n" + "=" * 60)
    print("2단계: Tesseract OCR로 텍스트 추출")
    print("=" * 60)

    tsv_data = run_tesseract_tsv(OUTPUT_IMAGE)
    structured_results = parse_tsv(tsv_data, zoom_factor)

    print(f"\n총 {len(structured_results)}개의 텍스트 영역 감지")

    # JSON으로 저장
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(structured_results, f, ensure_ascii=False, indent=2)

    print(f"결과 저장 완료: {OUTPUT_JSON}")

    # 샘플 출력
    print("\n" + "=" * 60)
    print("OCR 결과 샘플 (신뢰도 50 이상)")
    print("=" * 60)

    high_confidence = [r for r in structured_results if r["confidence"] > 50]
    high_confidence.sort(key=lambda x: (x["pdf_coords"]["y"], x["pdf_coords"]["x"]))

    for i, item in enumerate(high_confidence[:40]):
        print(f"[{i+1}] '{item['text']}' (신뢰도: {item['confidence']})")
        print(f"     위치: ({item['pdf_coords']['x']:.1f}, {item['pdf_coords']['y']:.1f})")

    # Y 좌표 기준으로 그룹화하여 행별로 출력
    print("\n" + "=" * 60)
    print("행별 텍스트 그룹화 (Y 좌표 기준)")
    print("=" * 60)

    rows = defaultdict(list)
    for item in high_confidence:
        y_group = round(item["pdf_coords"]["y"] / 20) * 20
        rows[y_group].append(item)

    for y in sorted(rows.keys())[:25]:
        row_items = sorted(rows[y], key=lambda x: x["pdf_coords"]["x"])
        texts = [item["text"] for item in row_items]
        print(f"Y={y:>4}: {' | '.join(texts)}")

if __name__ == "__main__":
    main()
