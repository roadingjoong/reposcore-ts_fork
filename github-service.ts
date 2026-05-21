import {graphql} from '@octokit/graphql';

import type {
  ContributionLabel,
  DetailedRepoData,
  IssueRecord,
  PRRecord,
} from './types';

import {loadCache, saveCache} from './cache';

interface RawAuthor {
  login: string;
}

interface RawLabel {
  name: string;
}

interface RawIssue {
  number: number;
  title: string;
  url: string;
  state: string;
  createdAt: string;
  closedAt: string | null;
  author: RawAuthor | null;
  labels: {nodes: RawLabel[]} | null;
}

interface RawPullRequest {
  number: number;
  title: string;
  url: string;
  merged: boolean;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  author: RawAuthor | null;
  labels: {nodes: RawLabel[]} | null;
}

interface DetailedRepoResponse {
  repository: {
    issues: {nodes: RawIssue[]};
    pullRequests: {nodes: RawPullRequest[]};
  };
}

const PAGE_SIZE = 100;

export const normalizeLabel = (label: string): ContributionLabel => {
  const key = label.toLowerCase().replace(/[-_\s]/g, '');
  if (key === 'feat' || key === 'feature') return 'feature';
  if (key === 'bug') return 'bug';
  if (key === 'doc' || key === 'docs' || key === 'documentation') return 'doc';
  if (key === 'typo') return 'typo';
  return 'none';
};

export const categorizeLabels = (labels: string[]): ContributionLabel => {
  for (const label of labels) {
    const category = normalizeLabel(label);
    if (category !== 'none') {
      return category;
    }
  }
  return 'none';
};

const extractLabelNames = (labels: {nodes: RawLabel[]} | null): string[] => {
  if (!labels || !labels.nodes) return [];
  return labels.nodes.map(node => node.name).filter(name => Boolean(name));
};

const toIssueRecord = (raw: RawIssue): IssueRecord => {
  const labels = extractLabelNames(raw.labels);
  return {
    number: raw.number,
    title: raw.title,
    url: raw.url,
    labels,
    category: categorizeLabels(labels),
    state: raw.state,
    author: raw.author?.login,
    createdAt: raw.createdAt,
    closedAt: raw.closedAt ?? undefined,
  };
};

const toPrRecord = (raw: RawPullRequest): PRRecord => {
  const labels = extractLabelNames(raw.labels);
  return {
    number: raw.number,
    title: raw.title,
    url: raw.url,
    isMerged: raw.merged,
    labels,
    category: categorizeLabels(labels),
    additions: raw.additions,
    deletions: raw.deletions,
    mergedAt: raw.mergedAt ?? undefined,
    author: raw.author?.login,
  };
};

export const mapDetailedRepoResponse = (
  response: DetailedRepoResponse,
): DetailedRepoData => {
  const issueNodes = response.repository.issues?.nodes ?? [];
  const prNodes = response.repository.pullRequests?.nodes ?? [];

  return {
    issues: issueNodes.map(toIssueRecord),
    prs: prNodes.map(toPrRecord),
  };
};

export interface CategoryCounts {
  feature: number;
  bug: number;
  doc: number;
  typo: number;
  none: number;
}

export const countByCategory = (
  records: ReadonlyArray<{category: ContributionLabel}>,
): CategoryCounts => {
  const counts: CategoryCounts = {
    feature: 0,
    bug: 0,
    doc: 0,
    typo: 0,
    none: 0,
  };

  for (const record of records) {
    counts[record.category] += 1;
  }

  return counts;
};

export const createGitHubService = (token: string) => {
  const githubGraphQL = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

  const getDetailedRepoData = async (
    owner: string,
    repo: string,
    useCache = true,
  ): Promise<DetailedRepoData> => {
    const cached = await loadCache<DetailedRepoData>(owner, repo, !useCache);
    if (cached) return cached.data;

    const response = await githubGraphQL<DetailedRepoResponse>(
      `
      query($owner: String!, $repo: String!, $pageSize: Int!) {
        repository(owner: $owner, name: $repo) {
          issues(first: $pageSize, states: CLOSED, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              number
              title
              url
              state
              createdAt
              closedAt
              author { login }
              labels(first: 20) { nodes { name } }
            }
          }
          pullRequests(first: $pageSize, states: MERGED, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              number
              title
              url
              merged
              mergedAt
              additions
              deletions
              author { login }
              labels(first: 20) { nodes { name } }
            }
          }
        }
      }
      `,
      {owner, repo, pageSize: PAGE_SIZE},
    );

    const data = mapDetailedRepoResponse(response);

    await saveCache(owner, repo, data);

    return data;
  };

  return {
    getDetailedRepoData,
  };
};
