# NICU Drug Infusion Calculator

신생아 중환자실(NICU)에서 사용하는 약물 주입속도 계산기입니다.
cc/hr과 mcg/kg/min 간 환산, 처방 검증, 희석 계산을 지원합니다.

> **Live**: [nicu-preview-app.vercel.app](https://nicu-preview-app.vercel.app)

## Features

- **처방 검증** — 현재 믹싱 비율 기반으로 주입속도(cc/hr) ↔ 용량(mcg/kg/min) 자동 환산
- **환산표** — 현재 믹싱 비율 및 선택 비율 기준 환산 테이블
- **용량 → 속도 / 속도 → 용량** — 원하는 비율 프리셋 또는 직접 입력으로 계산
- **약물 정보** — 카테고리별 약물 설명, 투여 범위, 호환 수액, 비호환 약물
- **용어 해설** — 주요 약리학 용어를 쉽게 설명
- **미니 계산기** — 간단한 사칙연산 계산기 내장
- **비밀번호 잠금** — 접근 제한용 PIN 입력 화면

## Supported Drugs

| Category | Drugs |
|----------|-------|
| Cardiovascular | Dopamine, Dobutamine, Milrinone, Epinephrine, Norepinephrine, Vasopressin |
| Respiratory | Remodulin (Treprostinil) |
| Sedation / Analgesia | Midazolam, Fentanyl, Sufentanyl, Ketamine, Vecuronium, Precedex |
| Endocrine | Humalog (Insulin Lispro) |
| Diuretics | Lasix (Furosemide) |
| Anticoagulation | Heparin |

## Tech Stack

- **React 19** — Single-file component (`NICUDrugCalculator.jsx`)
- **Tailwind CSS v4** — Utility-first styling with `@tailwindcss/vite` plugin
- **Vite** — Dev server & production build
- **Vercel** — Deployment

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

## Design

- Primary: `#F48C25` (Orange)
- Background: `#F8F9FA`
- Font: Inter, Pretendard

## License

Internal use only.

---

*Made by NURDS*
