## 🧾 Git Commit Convention

### ✅ Commit Message 구조

```
type(문맥 정보): subject

본문 (선택)
```

### 📌 사용 가능한 타입(Type)

| 타입       | 설명                                              |
| ---------- | ------------------------------------------------- |
| `feat`     | 새로운 기능 추가                                  |
| `fix`      | 버그 수정                                         |
| `docs`     | 문서 추가 및 수정 (README 등)                     |
| `style`    | 코드 포맷팅, 세미콜론 누락 등 기능 변화 없는 수정 |
| `refactor` | 코드 리팩토링 (기능 변화 없음)                    |
| `test`     | 테스트 코드 추가/수정                             |
| `chore`    | 빌드 업무, 패키지 매니저 설정 등 기타 변경        |
| `perf`     | 성능 개선                                         |
| `ci`       | CI 설정 수정                                      |
| `build`    | 빌드 관련 파일 수정                               |

### ✏️ 예시

```
feat(auth): 사용자 로그인 기능 구현

로그인 성공 시 JWT 발급 및 로컬스토리지 저장 로직 추가
```

```
fix(auth): 회원가입 시 중복 이메일 체크 오류 수정
```

```
docs: 프로젝트 소개 및 기술 스택 문서 추가
```

```
style: 세미콜론 누락 및 공백 정리
```

### 📖 커밋 메시지 작성 규칙

1. 제목은 **50자 이내**로 작성, 첫 글자는 대문자(한글은 그냥 쓰기).
2. 제목 끝에 `마침표(.)` 쓰지 않기.
3. **한글 또는 영어** 자유롭게 사용 가능.
4. 제목 행에 명령문 사용('~ 수정' or '~ 제거')
5. 본문이 있다면, 제목과 본문 사이에 한 줄 공백 삽입.
6. 본문은 **무엇을, 왜** 변경했는지 설명.
   - 보는 사람(검토자)이 원래 문제가 무엇인지 이해한다고 가정하지 말고 확실하게 설명 추가

---

## 🌿 Git 브랜치 전략

### 📌 브랜치 종류

| 브랜치 이름 | 용도                                   |
| ----------- | -------------------------------------- |
| `master`    | 실제 배포되는 운영 브랜치 (최종 제품)  |
| `develop`   | 통합 개발 브랜치 (모든 기능이 merge됨) |
| `FE/dev`    | 프론트엔드 통합 브랜치                |
| `BE/dev`    | 백엔드 통합 브랜치                |
| `DATA/dev`  | 데이터/분석 관련 통합 브랜치             |
| `FE/*`      | 프론트엔드 작업용 브랜치               |
| `BE/*`      | 백엔드 작업용 브랜치                   |
| `DATA/*`    | 데이터/분석 관련 작업용 브랜치             |
| `release/*` | 배포 준비 브랜치 (버전 태깅 등 포함)   |
| `hotfix/*`  | 운영 중 긴급 수정 브랜치               |

### 🛠 브랜치 네이밍 규칙

- `FE/feature/login`
- `FE/fix/header-style`
- `BE/feature/auth-api`
- `BE/fix/signup-validation`
- `DATA/feature/recommendation-model`
- `release/v1.0.0`
- `hotfix/server-crash`

### 🔁 브랜치 사용 흐름

1. 기능 개발 시:  
   → `develop` 브랜치에서 `FE/feature/기능명`, `BE/feature/기능명`, `DATA/feature/기능명` 브랜치 생성 후 작업  
   → 완료되면 `develop`에 Pull Request로 merge

2. 버그 수정 시:  
   → `develop` 또는 `master` 기준으로 `FE/fix/버그명`, `BE/fix/버그명`, `DATA/fix/버그명` 브랜치 생성 후 수정  
   → 완료되면 `develop`에 merge (운영 이슈면 `master`에 바로 hotfix 가능)

3. 배포 준비 시:  
   → `develop` → `release/vX.X.X` 브랜치 생성  
   → 테스트 완료 후 `master`에 merge + 버전 태깅

4. 긴급 수정 시:  
   → `master`에서 `hotfix/이슈명` 브랜치 생성  
   → 수정 후 `master` + `develop`에 각각 merge

---
