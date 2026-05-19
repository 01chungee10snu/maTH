# API Configuration

이 저장소에는 Supabase `service_role` 키를 저장하지 않습니다.

현재 앱은 `maTH-adventure` Supabase 프로젝트의 public 설정만 `js/supabasePublicConfig.js`에서 읽습니다. 게임 진행 데이터는 아직 브라우저 로컬 저장소를 사용하며, DB 쓰기는 RLS 정책과 로그인 흐름이 확정된 뒤 활성화합니다.

운영에서 Supabase를 다시 사용할 경우:

1. `service_role` 키는 서버 환경 변수에만 둡니다.
2. 브라우저에 노출되는 파일에는 publishable/anon public key만 둡니다.
3. 이전에 노출된 `service_role` 키는 Supabase 콘솔에서 즉시 회전합니다.
4. 아동 학습 데이터는 최소 수집, 삭제 기능, 보호자 동의 정책을 먼저 정합니다.
5. 로컬 비공개 override가 필요하면 `.env` 또는 `js/supabaseLocalConfig.js`를 사용하고 커밋하지 않습니다.
