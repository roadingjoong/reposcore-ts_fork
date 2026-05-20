# TypeScript 코딩 컨벤션 가이드

> 본 문서는 프로젝트 전체에서 일관된 TypeScript 코드 스타일을 유지하기 위한 컨벤션을 정의합니다.
> 세부적인 규칙은 [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)를 참고하세요.

---

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 변수 | camelCase | `userName`, `issueCount` |
| 함수 | camelCase | `getIssues()`, `calculateScore()` |
| 클래스 | PascalCase | `GitHubService`, `ScoreCalculator` |
| 인터페이스 | PascalCase | `UserScore`, `IssueData` |
| 타입 | PascalCase | `ScoreResult`, `RepoInfo` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| 파일명 | kebab-case | `github-service.ts`, `score-calculator.ts` |

---

## 타입 정의 방식 (interface vs type)

- **interface** → 객체 형태의 타입 정의에 사용
- **type** → 유니온, 인터섹션 등 복잡한 타입 정의에 사용

```typescript
// interface 사용 (객체 형태)
interface UserScore {
  userId: string;
  totalScore: number;
  prCount: number;
  issueCount: number;
}

// type 사용 (유니온 타입)
type OutputFormat = 'csv' | 'json' | 'table';
```

---

## 함수 작성 방식

- 일반적으로 **arrow function** 사용을 권장합니다.
- 비동기 함수는 **async/await** 를 사용합니다.

```typescript
// arrow function
const calculateScore = (prCount: number, issueCount: number): number => {
  return prCount * 3 + issueCount;
};

// async/await
const getIssues = async (repo: string): Promise<Issue[]> => {
  const issues = await fetchIssues(repo);
  return issues;
};
```

---

## import/export 규칙

- **named export** 를 기본으로 사용합니다.
- `index.ts` 에서 모듈을 한곳에 모아 re-export 합니다.

```typescript
// named export
export const calculateScore = () => { ... };
export interface UserScore { ... }

// import
import { calculateScore, UserScore } from './score-calculator';
```

---

## 기본 코드 스타일

- 들여쓰기: **2 spaces**
- 세미콜론: **항상 사용**
- 따옴표: **single quote (`'`)** 사용
- 한 줄 최대 **100자** 권장

```typescript
// Good
const userName = 'user1';
const score = calculateScore(3, 2);

// Bad
const userName = "user1"
const score = calculateScore(3,2)
```

---

## GTS (Google TypeScript Style)

본 프로젝트는 코드 스타일 검사 및 자동 포맷팅을 위해 `gts`를 사용합니다.

`gts`는 Google TypeScript Style Guide 기반 도구이며, 프로젝트 내 코드 스타일을 일관되게 유지하기 위한 ESLint 및 Prettier 설정을 제공합니다.

### 프로젝트 스크립트

`package.json`에는 다음 스크립트가 등록되어 있습니다.

```json
{
  "scripts": {
    "lint": "gts lint",
    "fix": "gts fix",
    "typecheck": "tsc --noEmit"
  }
}
```

### 코드 검사

```bash
bun run lint
```

실행 내용:

- ESLint 기반 코드 스타일 검사 수행
- 규칙 위반 여부 확인

### 자동 수정

```bash
bun run fix
```

실행 내용:

- ESLint 자동 수정 수행
- Prettier 포맷 적용

### 타입 검사

```bash
bun run typecheck
```

실행 내용:

- TypeScript 타입 오류 확인

### 프로젝트 설정 구조

프로젝트는 gts 기본 설정 위에 추가 설정을 사용합니다.

#### eslint.config.cjs

현재 프로젝트:

```js
module.exports = [...customConfig, ...require('gts')];
```

역할:

- `eslint.ignores.cjs` 존재 여부 확인
- 프로젝트 ignore 규칙 적용
- gts 기본 설정 추가

#### .prettierrc.cjs

현재 프로젝트:

```js
module.exports = {
  ...require('gts/.prettierrc.json'),
};
```

역할:

- gts 기본 Prettier 설정 사용

#### eslint.ignores.cjs

역할:

- ESLint 검사 제외 대상 관리

---

## 참고 자료

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [GTS 공식 저장소](https://github.com/google/gts)
- [ESLint 공식 문서](https://eslint.org/docs/latest/)
- [Prettier 공식 문서](https://prettier.io/docs/)
