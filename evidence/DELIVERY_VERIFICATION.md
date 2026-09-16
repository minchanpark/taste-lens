# 배달 플랫폼 MVP 검증

2026-09-14 KST. PRD와 사용자가 제공한 청아 딜리버리 참고 앱을 확인하고 Next.js 16 + Supabase 기반으로 구현했다.

## 확인한 결과

- 프로덕션 빌드 및 TypeScript 검사 통과.
- 수치 로직 단위 테스트 5개 통과.
- 실제 Supabase 통합 테스트 2개 통과: RLS 및 프로필/기록 흐름, 테스트 주문의 수량·가격·배달비 계산, 사용자 격리, 중복 요청 방지, 잘못된 수량과 null 상황 값 거부.
- 프로덕션 서버에서 브라우저 테스트 3개 통과: 손님 검색·찜·장바구니 복구·가게 교체, 이메일 로그인·10문항·식당 비교·수량 2개 포장 주문·취향 반영·재방문, 390px 모바일·상황 선택·검색 결과 없음 처리.
- 데스크톱 홈과 모바일 전체 화면을 시각적으로 확인했다.
- 일회성 테스트 사용자 2명과 관련 데이터/세션을 제거했다. fixture 사용자 잔여 수 0을 확인했고 로컬 테스트 자격증명과 trace도 제거했다.
- Supabase security advisor의 RLS 관련 문제 없음. 기존 Auth의 [유출 비밀번호 보호](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) 비활성 경고 1건은 유지되어 있다.

## 증거

- `delivery-build.log`, `typecheck.log`, `unit-tests.log`, `delivery-integration.log`, `e2e-results.json`
- `delivery-desktop.png`, `delivery-mobile.png`, `delivery-cart.png`, `delivery-checkout.png`

## 검증 경계

전체 상태는 **demo-ready**다. 실제 Supabase Auth·DB 및 Open-Meteo 연결을 사용하지만 가게/메뉴 가격/리뷰/예상 배달 시간은 합성 데이터이며 주문은 결제나 실제 배달 접수가 없는 테스트 기록이다. 사진은 카테고리 예시다. 인증된 일회성 계정으로 이메일/비밀번호 로그인을 검증했으며 실제 사용자의 회원가입 메일 수신은 검증하지 않았다. Solar 추출, H1/H2/H3 사용자 실험 및 사용자 직접 수락도 완료했다고 주장하지 않는다.

사용자 검증자와 검증 시각은 아직 확인되지 않아 `.document-driven/mvp-evidence.json`의 해당 두 필드는 null이다. 스키마 검증기의 이 두 오류는 자동 테스트 실패와 구분한다.
