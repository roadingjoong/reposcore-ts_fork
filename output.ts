import {countByCategory} from './github-service';
import type {DetailedRepoData} from './github-service';

const DEFAULT_OUTPUT_DIR = 'output';
const CSV_FILENAME = 'scores.csv';
const TXT_FILENAME = 'scores.txt';

export interface RepoSummary {
  repoPath: string;
  mergedPrFeatureBug: number;
  mergedPrDocs: number;
  mergedPrTypo: number;
  closedIssueFeatureBug: number;
  closedIssueDocs: number;
}

export interface OutputPaths {
  csv: string;
  txt: string;
}

// 향후 --output 옵션이 추가되어도 경로 조합 로직이 한곳에 모이도록 분리합니다.
export const getOutputPaths = (
  outputDir: string = DEFAULT_OUTPUT_DIR,
): OutputPaths => ({
  csv: `${outputDir}/${CSV_FILENAME}`,
  txt: `${outputDir}/${TXT_FILENAME}`,
});

// DetailedRepoData를 저장소별 요약(RepoSummary)으로 변환합니다.
// CSV/TXT 양쪽 모두 이 단일 구조에서 직접 생성합니다.
export const summarizeRepo = (
  repoPath: string,
  detailed: DetailedRepoData,
): RepoSummary => {
  const prCounts = countByCategory(detailed.prs);
  const issueCounts = countByCategory(detailed.issues);
  return {
    repoPath,
    mergedPrFeatureBug: prCounts.feature + prCounts.bug,
    mergedPrDocs: prCounts.doc,
    mergedPrTypo: prCounts.typo,
    closedIssueFeatureBug: issueCounts.feature + issueCounts.bug,
    closedIssueDocs: issueCounts.doc,
  };
};

const CSV_HEADERS = [
  'repository',
  'mergedPrFeatureBug',
  'mergedPrDocs',
  'mergedPrTypo',
  'closedIssueFeatureBug',
  'closedIssueDocs',
] as const;

export const buildCsvText = (summaries: ReadonlyArray<RepoSummary>): string => {
  const rows = summaries.map(s =>
    [
      s.repoPath,
      s.mergedPrFeatureBug,
      s.mergedPrDocs,
      s.mergedPrTypo,
      s.closedIssueFeatureBug,
      s.closedIssueDocs,
    ].join(','),
  );
  return [CSV_HEADERS.join(','), ...rows].join('\n') + '\n';
};

export const buildTxtText = (summaries: ReadonlyArray<RepoSummary>): string => {
  const blocks = summaries.map(s =>
    [
      `[${s.repoPath}]`,
      `Merged PRs - feature: ${s.mergedPrFeatureBug}, docs: ${s.mergedPrDocs}, typo: ${s.mergedPrTypo}`,
      `Closed Issues - feature: ${s.closedIssueFeatureBug}, docs: ${s.closedIssueDocs}`,
    ].join('\n'),
  );
  return blocks.join('\n\n') + '\n';
};

// CSV는 항상 생성, format이 'txt'인 경우 TXT를 추가로 생성합니다.
// reposcore-cs와 동일한 사양을 따릅니다.
export const writeOutputFiles = async (
  format: 'csv' | 'txt',
  summaries: ReadonlyArray<RepoSummary>,
  outputDir: string = DEFAULT_OUTPUT_DIR,
): Promise<OutputPaths | {csv: string}> => {
  const paths = getOutputPaths(outputDir);

  await Bun.write(paths.csv, buildCsvText(summaries));

  if (format === 'txt') {
    await Bun.write(paths.txt, buildTxtText(summaries));
    return paths;
  }

  return {csv: paths.csv};
};
