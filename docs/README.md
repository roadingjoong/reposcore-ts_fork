# 프로젝트 운영 지침 및 개발 가이드

> 점수 계산 공식 및 이슈/PR 작성 주의사항 등 공통 사항은
> [reposcore-cs 저장소](https://github.com/oss2026hnu/reposcore-cs)의 docs를 참고하세요.

## 문서 목록

현재 등록된 문서가 없습니다. 문서가 추가되면 아래에 목록이 업데이트됩니다.

<!-- DOC_LIST_START -->
- [cac-guide.md](./cac-guide.md): Cac 라이브러리 가이드
- [octokit-guide.md](./octokit-guide.md): TypeScript/Bun 기반 GitHub GraphQL 가이드
- [ts-bun-guide.md](./ts-bun-guide.md): TypeScript 및 실행 환경 Bun 가이드
- [ts-convention.md](./ts-convention.md): TypeScript 코딩 컨벤션 가이드
- [vscode-extension.md](./vscode-extension.md): TypeScript 개발을 위한 VSCode 확장 가이드
<!-- DOC_LIST_END -->

---
> ⚠️ **문서 목록은 수작업으로 갱신하지 마세요.**
> `docs/*.md` 문서를 생성·삭제하거나 제목을 변경할 경우, 반드시 아래 스크립트를 실행하여 목록을 자동 갱신하세요.
> ```bash
> python tools/update-docs-readme.py
> ```
>
> 스크립트 위치: `tools/update-docs-readme.py`
---
프로젝트 내 문서 파일의 일관성을 유지하기 위해 다음과 같은 파일 이름 생성 규칙을 따릅니다.
---
