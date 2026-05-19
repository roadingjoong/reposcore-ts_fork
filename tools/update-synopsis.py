"""
---------------------
CLI help 출력을 이용하여 최상위 README.md의 Synopsis 구간을 자동 갱신합니다.

사용법 (프로젝트 루트에서):
    python tools/update-synopsis.py

동작:
    1. README-template.md를 읽어 기본 구조를 가져옴
    2. `bun run index.ts --help` 를 실행하여 CLI help 출력을 캡처
    3. README-template.md의 <!-- SYNOPSIS_START --> ~ <!-- SYNOPSIS_END --> 구간을
       캡처한 help 출력으로 교체하여 최상위 README.md를 생성/업데이트
"""

import re
import subprocess
import sys
from pathlib import Path

# ── 설정 ──────────────────────────────────────────────────────────────────────
ROOT_DIR         = Path(__file__).parent.parent
TEMPLATE_README  = ROOT_DIR / "README-template.md"
README_PATH      = ROOT_DIR / "README.md"

MARKER_START = "<!-- SYNOPSIS_START -->"
MARKER_END   = "<!-- SYNOPSIS_END -->"

DEFAULT_TEMPLATE = """\
# reposcore-ts

`reposcore-ts`는 GraphQL을 사용하여 오픈소스 수업 저장소의 학생 참여 점수를 계산하는 **TypeScript 기반 CLI**입니다.


## Usage

### 의존성 설치

```bash
bun install
```

### CLI 실행

여러 개의 저장소를 한 번에 분석할 수 있습니다.

```bash
# 기본 실행 예시
bun run index.ts <owner/repo...> [options]

# GitHub 개인 액세스 토큰(PAT) 사용 예시
bun run index.ts oss2026hnu/reposcore-ts --token YOUR_GITHUB_TOKEN
```

## Synopsis

{start}

{end}
""".format(start=MARKER_START, end=MARKER_END)
# ──────────────────────────────────────────────────────────────────────────────


def get_cli_help() -> str:
    """bun run index.ts --help 를 실행하여 출력 결과를 반환합니다."""
    try:
        result = subprocess.run(
            ["bun", "run", "index.ts", "--help"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout.strip()
        if not output:
            # --help가 stderr로 출력되는 경우 대비
            output = result.stderr.strip()
        if not output:
            print("[오류] CLI help 출력이 비어 있습니다.", file=sys.stderr)
            sys.exit(1)
        return output
    except FileNotFoundError:
        print("[오류] bun 명령을 찾을 수 없습니다. bun이 설치되어 있는지 확인하세요.", file=sys.stderr)
        sys.exit(1)
    except subprocess.TimeoutExpired:
        print("[오류] CLI 실행 시간이 초과되었습니다.", file=sys.stderr)
        sys.exit(1)


def build_synopsis_block(help_output: str) -> str:
    """CLI help 출력을 코드 블록으로 감싼 문자열을 반환합니다."""
    return f"```text\n{help_output}\n```"


def ensure_template(template_path: Path) -> None:
    """템플릿 파일이 없으면 기본값으로 생성합니다."""
    if not template_path.exists():
        template_path.write_text(DEFAULT_TEMPLATE, encoding="utf-8")
        print(f"[생성] {template_path}")


def update_readme(readme_path: Path, template_path: Path, new_block: str) -> None:
    """템플릿을 읽어 Synopsis 구간을 교체한 뒤 README.md를 생성/업데이트합니다."""
    original = template_path.read_text(encoding="utf-8")

    if MARKER_START not in original:
        appended = original.rstrip() + f"\n\n{MARKER_START}\n{MARKER_END}\n"
        template_path.write_text(appended, encoding="utf-8")
        original = appended
        print("[안내] 마커가 없어 템플릿 파일 끝에 추가했습니다.")

    pattern = re.compile(
        rf"{re.escape(MARKER_START)}.*?{re.escape(MARKER_END)}",
        re.DOTALL,
    )
    replacement = f"{MARKER_START}\n{new_block}\n{MARKER_END}"
    updated = pattern.sub(replacement, original)

    readme_path.write_text(updated, encoding="utf-8")
    print(f"[업데이트] {readme_path}")


def main() -> None:
    ensure_template(TEMPLATE_README)

    print("[실행] bun run index.ts --help")
    help_output = get_cli_help()
    print("[캡처] CLI help 출력:")
    for line in help_output.splitlines():
        print(f"  {line}")

    new_block = build_synopsis_block(help_output)
    update_readme(README_PATH, TEMPLATE_README, new_block)
    print("완료!")


if __name__ == "__main__":
    main()
