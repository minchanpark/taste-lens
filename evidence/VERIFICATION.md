# 검증 결과

2026-09-14 KST, 실제 Supabase 프로젝트와 localhost 프로덕션 서버에서 검증했습니다.

- 프로덕션 빌드 및 TypeScript: 통과.
- 알고리즘 테스트 5개: 통과. RMS 거리, 동점 안정성, 10문항 분기, 벡터 범위, context cold-start 및 shrinkage, 식당 리뷰 percentile/빈 근거 fallback, 한국 시간 분류.
- 실제 DB 통합 시나리오 1개: 통과. 공개 카탈로그 읽기, 공개 쓰기 거부, 비로그인 개인 테이블 차단, 두 계정 간 읽기/소유권 변경 차단, 벡터 범위 제한, 동시 중복 식사 기록 방지, 반복 배치의 멱등성, 재선택 .18 업데이트.
- 브라우저 시나리오 2개: 통과. 이메일/비밀번호 로그인→10문항→5개 추천→3개 식당→근거→가격순→기록→batch→새로고침→로그아웃/재로그인 복원. 390px 모바일 가로 넘침, 잘못된 로그인, 카탈로그 장애 메시지.
- 서울 실시간 날씨: Open-Meteo 응답 확인. 데이터는 evidence/weather.json에 저장.
- npm audit: 취약점 0개.
- Supabase security advisor: 테이블/RLS 문제 없음. 프로젝트의 [유출 비밀번호 보호](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)가 꺼져 있다는 경고 1건은 기존 Auth 설정으로 남아 있습니다.
- Performance advisor: 새 테이블의 미사용 인덱스 INFO 4건. FK 및 RLS 조회용 인덱스로 유지했습니다.

## 발견 후 해결한 문제

초기 브라우저 실행 환경에 Chromium이 없어 공식 Playwright 패키지를 설치했습니다. 모바일 category strip의 min-content 폭 때문에 화면이 465px로 넘치던 문제를 min-width:0/minmax(0,1fr)로 해결했습니다. 테스트 selector의 모호성 및 Next.js alert 중복을 수정했습니다. 테스트 중 HMR의 상태 초기화 영향을 제거하기 위해 최종 검증은 프로덕션 빌드로 수행했습니다. 통합 테스트의 기본 global signout이 병행 브라우저 테스트의 세션을 무효화하던 문제는 테스트 세션을 local signout으로 바꾸고 순차 재검증했습니다.

## 검증하지 않은 항목

- 실제 사용자의 인증 이메일 수신/인증 완료. 자동 테스트는 두 개의 일회성, 확인된 이메일 fixture로 로그인했으며 타인의 주소로 이메일을 발송하지 않았습니다. 해당 fixture 및 관련 기록은 검증 후 정리했습니다.
- 실제 배달 주문, 실제 식당 영업/주소, 실제 고객 리뷰, Solar Pro 4 추출.
- H1/H2/H3 제품 정확도 목표, 사용자 20~50명 평가, end-to-end p95<500ms, 장기간 운영 안정성.
- 사용자의 직접 제품 수락 및 검증자 이름/시각. 증거 검증 스크립트는 이 두 필드가 없어서 아직 통과하지 않습니다. 해당 내용을 임의로 채우지 않았습니다.

전체 단계: **demo-ready**. 실제 Auth·DB·날씨 연결과 합성 카탈로그를 구분하며, 사용자 제품 검증 또는 pilot-ready를 주장하지 않습니다.
