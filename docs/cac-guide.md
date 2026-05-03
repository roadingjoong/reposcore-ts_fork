# Cac 라이브러리 가이드

## 개요

이 문서는 TypeScript CLI 프로그램 개발을 위해 사용하는 cac 라이브러리의 기본적인 사용 방법을 설명합니다.

프로젝트에서는 CLI 라이브러리를 cac로 통일하여, 개발자마다 다른 방식으로 구현하는 것을 방지하고 일관된 개발 환경을 유지합니다.

---

## cac란?

cac는 Node.js/TypeScript 환경에서 CLI 프로그램을 쉽게 만들 수 있도록 도와주는 라이브러리입니다.

- 가볍고 빠름
- 직관적인 API 제공
- TypeScript와 호환성 우수

---

## 설치 방법 (bun 기준)

다음 명령어로 설치합니다.

```
bun add cac
```

---

## 기본 사용 예시

```ts
import { cac } from 'cac'

const cli = cac('app')

cli
  .command('hello <name>')
  .action((name) => {
    console.log(`Hello ${name}`)
  })

cli.help()
cli.parse()
```

---

## 옵션(option) 사용

```ts
import { cac } from 'cac'

const cli = cac()

cli
  .command('greet')
  .option('--name <name>', '이름 입력')
  .action((options) => {
    console.log(`Hello ${options.name}`)
  })

cli.parse()
```

### 실행 예시

```
bun run index.ts greet --name kim
```

출력:

```
Hello kim
```

---

## help 기능

```ts
cli.help()
```

실행:

```
bun run index.ts --help
```

---

## 정리

- CLI 프로그램을 쉽게 만들 수 있음
- command 기반 구조 지원
- 옵션(option) 처리 가능
- 자동 help 기능 제공

---

## 목적

- CLI 개발 방식 통일
- 유지보수성 향상
- 개발자 간 협업 효율 증가

---

## 참고 문서

- [cac GitHub Repository](https://github.com/cacjs/cac)
- [cac npm Package](https://www.npmjs.com/package/cac)

