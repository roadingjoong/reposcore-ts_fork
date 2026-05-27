# TypeScript/Bun 기반 GitHub GraphQL 가이드

## 의존성 확인 및 설치

본 프로젝트에 이미 `@octokit/graphql`이 등록되어 있으므로 별도 설치 없이 아래 명령으로 의존성을 설치합니다.

```bash
bun install
```

---

## 기본 설정

`index.ts` 또는 별도 파일에 GitHub GraphQL 클라이언트를 설정합니다.

```ts
import {graphql} from '@octokit/graphql';

const githubGraphQL = graphql.defaults({
  headers: {
    authorization: `token ${Bun.env.GITHUB_TOKEN}`,
  },
});
```

토큰은 코드에 직접 쓰지 않고 환경 변수(`GITHUB_TOKEN`)로 설정합니다.

```bash
GITHUB_TOKEN=your_token bun run index.ts
```

---

## TypeScript 인터페이스로 응답 타입 정의

GraphQL 응답 구조에 맞춰 타입을 정의합니다.

```ts
interface Author {
  login: string;
}

interface Issue {
  title: string;
  url: string;
  author: Author | null;
}

interface PullRequest {
  title: string;
  url: string;
  author: Author | null;
}

interface IssuesResponse {
  repository: {
    issues: {
      nodes: Issue[];
    };
  };
}

interface PullRequestsResponse {
  repository: {
    pullRequests: {
      nodes: PullRequest[];
    };
  };
}
```

---

## Issue 조회 예시

```ts
const result = await githubGraphQL<IssuesResponse>(
  `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      issues(first: 10, states: OPEN) {
        nodes {
          title
          url
          author {
            login
          }
        }
      }
    }
  }
  `,
  {
    owner: 'oss2026hnu',
    repo: 'reposcore-ts',
  },
);

console.log(result.repository.issues.nodes);
```

---

## Pull Request 조회 예시

```ts
const result = await githubGraphQL<PullRequestsResponse>(
  `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: 10, states: OPEN) {
        nodes {
          title
          url
          author {
            login
          }
        }
      }
    }
  }
  `,
  {
    owner: 'oss2026hnu',
    repo: 'reposcore-ts',
  },
);

console.log(result.repository.pullRequests.nodes);
```

---

## Issue + PR 통합 조회

```ts
const result = await githubGraphQL(
  `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      issues(first: 10) {
        nodes {
          author { login }
        }
      }
      pullRequests(first: 10) {
        nodes {
          author { login }
        }
      }
    }
  }
  `,
  {
    owner: 'oss2026hnu',
    repo: 'reposcore-ts',
  },
);
```

---

## 비동기 병렬 요청 처리

### 순차 await 방식의 문제점

여러 GraphQL 요청을 아래와 같이 순차적으로 `await`하면, 각 요청이 완료될 때까지 다음 요청이 시작되지 않습니다.

```ts
const issues = await fetchIssues(); // 완료될 때까지 대기
const pullRequests = await fetchPRs(); // issues가 끝난 후 시작
const commits = await fetchCommits(); // pullRequests가 끝난 후 시작
```

각 요청이 독립적임에도 불구하고 직렬로 실행되므로, 전체 실행 시간은 각 요청 시간의 합이 됩니다.  
예를 들어 각각 200ms가 걸린다면 총 600ms 이상이 소요됩니다.

---

### Promise.all 기반 병렬 처리 방식

`Promise.all()`을 사용하면 독립적인 비동기 요청을 동시에 실행할 수 있습니다.

```ts
const [issues, pullRequests, commits] = await Promise.all([
  fetchIssues(),
  fetchPRs(),
  fetchCommits(),
]);
```

세 요청이 동시에 시작되므로, 전체 실행 시간은 가장 오래 걸리는 요청 하나의 시간과 비슷해집니다.  
위 예시에서는 약 200ms 수준으로 단축됩니다.

---

### GitHub GraphQL 요청에서의 활용 예시

```ts
import {graphql} from '@octokit/graphql';

const githubGraphQL = graphql.defaults({
  headers: {
    authorization: `token ${Bun.env.GITHUB_TOKEN}`,
  },
});

const owner = 'oss2026hnu';
const repo = 'reposcore-ts';

const [issuesResult, prsResult, commitsResult] = await Promise.all([
  githubGraphQL<IssuesResponse>(
    `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issues(first: 100, states: CLOSED) {
          nodes { title url author { login } }
        }
      }
    }
    `,
    {owner, repo},
  ),
  githubGraphQL<PullRequestsResponse>(
    `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequests(first: 100, states: MERGED) {
          nodes { title url author { login } }
        }
      }
    }
    `,
    {owner, repo},
  ),
  githubGraphQL<CommitsResponse>(
    `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100) {
                nodes { message author { user { login } } }
              }
            }
          }
        }
      }
    }
    `,
    {owner, repo},
  ),
]);
```

---

### 성능 및 실행 시간 차이

| 방식          | 실행 구조 | 예상 소요 시간 (요청당 200ms 기준) |
| ------------- | --------- | ---------------------------------- |
| 순차 `await`  | 직렬 실행 | 약 600ms (200ms × 3)               |
| `Promise.all` | 병렬 실행 | 약 200ms (가장 긴 요청 기준)       |

요청 수가 많아질수록 병렬 처리의 효과는 더 커집니다.

---

### 병렬 처리 시 주의할 점

**에러 처리**

`Promise.all()`은 하나의 요청이라도 실패하면 전체가 reject됩니다.  
각 요청의 성공/실패를 독립적으로 처리하려면 `Promise.allSettled()`를 사용합니다.

```ts
const results = await Promise.allSettled([
  fetchIssues(),
  fetchPRs(),
  fetchCommits(),
]);

for (const result of results) {
  if (result.status === 'fulfilled') {
    console.log('성공:', result.value);
  } else {
    console.error('실패:', result.reason);
  }
}
```

**API Rate Limit**

GitHub API는 요청 수에 제한이 있습니다. 병렬 요청 수가 많을 경우 rate limit에 도달할 수 있으므로, 요청 수를 적절히 분산하거나 `@octokit/graphql`의 응답 헤더에서 남은 한도를 확인하는 것이 좋습니다.

**독립적인 요청에만 적용**

데이터 간 의존성이 있는 경우(예: A의 결과를 B의 입력으로 사용)에는 병렬 처리를 적용할 수 없습니다. 독립적인 요청에만 `Promise.all()`을 사용하세요.

---

## 참고 문서

- GitHub GraphQL API
  [https://docs.github.com/graphql](https://docs.github.com/graphql)

- GraphQL 기본 개념
  [https://graphql.org/learn/](https://graphql.org/learn/)

- MDN - Promise.all()
  [https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/all](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

- MDN - Promise.allSettled()
  [https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

---
