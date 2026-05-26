import {describe, test, expect} from 'bun:test';
import {ScoreCalculator, type RepoData} from '../score-calculator';
import type {DetailedRepoData} from '../types';

describe('ScoreCalculator 단위 테스트', () => {
  describe('buildIssuePrData() 데이터 매핑 규칙', () => {
    test('각 기여 카테고리별로 개수가 올바르게 분류되고 none 항목은 완전히 제외되어야 한다', () => {
      const mockDetailedData: DetailedRepoData = {
        prs: [
          {
            number: 1,
            title: 'feat: 기능 추가',
            url: '',
            merged: true,
            mergedAt: null,
            additions: 0,
            deletions: 0,
            labels: {nodes: []},
            category: 'feature',
            author: {login: 'contributor1'},
          },
          {
            number: 2,
            title: 'fix: 버그 수정',
            url: '',
            merged: true,
            mergedAt: null,
            additions: 0,
            deletions: 0,
            labels: {nodes: []},
            category: 'bug',
            author: {login: 'contributor1'},
          },
          {
            number: 3,
            title: 'docs: 문서 수정',
            url: '',
            merged: true,
            mergedAt: null,
            additions: 0,
            deletions: 0,
            labels: {nodes: []},
            category: 'doc',
            author: {login: 'contributor1'},
          },
          {
            number: 4,
            title: 'typo: 오타 수정',
            url: '',
            merged: true,
            mergedAt: null,
            additions: 0,
            deletions: 0,
            labels: {nodes: []},
            category: 'typo',
            author: {login: 'contributor1'},
          },
          {
            number: 5,
            title: '기타 라벨 없음',
            url: '',
            merged: true,
            mergedAt: null,
            additions: 0,
            deletions: 0,
            labels: {nodes: []},
            category: 'none',
            author: {login: 'contributor1'},
          },
        ],
        issues: [
          {
            number: 6,
            title: '이슈 1',
            url: '',
            labels: {nodes: []},
            category: 'feature',
            state: 'closed',
            createdAt: '',
            closedAt: null,
            author: {login: 'contributor1'},
          },
          {
            number: 7,
            title: '이슈 2',
            url: '',
            labels: {nodes: []},
            category: 'bug',
            state: 'closed',
            createdAt: '',
            closedAt: null,
            author: {login: 'contributor1'},
          },
          {
            number: 8,
            title: '이슈 3',
            url: '',
            labels: {nodes: []},
            category: 'doc',
            state: 'closed',
            createdAt: '',
            closedAt: null,
            author: {login: 'contributor1'},
          },
          {
            number: 9,
            title: '무시할 이슈',
            url: '',
            labels: {nodes: []},
            category: 'none',
            state: 'closed',
            createdAt: '',
            closedAt: null,
            author: {login: 'contributor1'},
          },
        ],
      };

      const result = ScoreCalculator.buildIssuePrData(mockDetailedData);

      expect(result).toHaveLength(1);

      const res = result[0]!;
      expect(res.userId).toBe('contributor1');
      expect(res.prFeatureBug).toBe(2);
      expect(res.prDocs).toBe(1);
      expect(res.prTypo).toBe(1);
      expect(res.issueFeatureBug).toBe(2);
      expect(res.issueDocs).toBe(1);
    });

    test("작성자(author) 정보가 없는 경우 'unknown'으로 바인딩되어야 한다", () => {
      const mockDetailedData: DetailedRepoData = {
        prs: [
          {
            number: 1,
            title: '탈퇴한 유저의 PR',
            url: '',
            merged: true,
            mergedAt: null,
            additions: 0,
            deletions: 0,
            labels: {nodes: []},
            category: 'feature',
            author: null,
          },
        ],
        issues: [],
      };

      const result = ScoreCalculator.buildIssuePrData(mockDetailedData);

      expect(result[0]!.userId).toBe('unknown');
    });
  });
  describe('최종 점수(totalScore) 및 제한 규칙 계산', () => {
    const getSingleUserScore = (repoData: RepoData) => {
      const userScores = ScoreCalculator.calculateUserScores([repoData]);
      return userScores[0]!.totalScore;
    };

    test('기본 가중치가 정상적으로 적용되는지 검증 (PR 및 이슈 조건이 제한선 미만일 때)', () => {
      const repoData: RepoData = {
        owner: 'test-owner',
        repo: 'test-repo',
        scoreData: [
          {
            userId: 'user1',
            prFeatureBug: 1,
            prDocs: 1,
            prTypo: 1,
            issueFeatureBug: 1,
            issueDocs: 1,
          },
        ],
      };
      expect(getSingleUserScore(repoData)).toBe(9);
    });

    test('Docs/Typo PR 제한 규칙: Feature/Bug PR 개수 기반 인정 한도를 초과하면 상한선까지만 점수가 인정되어야 한다', () => {
      const repoData: RepoData = {
        owner: 'test-owner',
        repo: 'test-repo',
        scoreData: [
          {
            userId: 'user2',
            prFeatureBug: 0,
            prDocs: 5,
            prTypo: 0,
            issueFeatureBug: 0,
            issueDocs: 0,
          },
        ],
      };
      expect(getSingleUserScore(repoData)).toBe(6);
    });

    test('Issue 인정 개수 제한 규칙: 유효 PR 총합 개수의 4배를 초과한 이슈는 점수 산정에서 누락되어야 한다', () => {
      const repoData: RepoData = {
        owner: 'test-owner',
        repo: 'test-repo',
        scoreData: [
          {
            userId: 'user3',
            prFeatureBug: 1,
            prDocs: 0,
            prTypo: 0,
            issueFeatureBug: 6,
            issueDocs: 0,
          },
        ],
      };
      expect(getSingleUserScore(repoData)).toBe(11);
    });

    test('PR이 아예 없고 Issue만 존재하는 사용자는 어뷰징 방지 캡핑에 의해 0점 처리되어야 한다', () => {
      const repoData: RepoData = {
        owner: 'test-owner',
        repo: 'test-repo',
        scoreData: [
          {
            userId: 'user4',
            prFeatureBug: 0,
            prDocs: 0,
            prTypo: 0,
            issueFeatureBug: 5,
            issueDocs: 5,
          },
        ],
      };
      expect(getSingleUserScore(repoData)).toBe(0);
    });
  });

  describe('calculateUserScores() 다중 저장소 합산 규칙', () => {
    test('동일한 사용자가 여러 저장소에 기여했을 때 데이터 카운트가 합산된 후 최종 점수 캡핑 규칙이 먹혀야 한다', () => {
      const repoA: RepoData = {
        owner: 'org',
        repo: 'repo-android',
        scoreData: [
          {
            userId: 'global-dev',
            prFeatureBug: 1,
            prDocs: 0,
            prTypo: 0,
            issueFeatureBug: 2,
            issueDocs: 0,
          },
        ],
      };

      const repoB: RepoData = {
        owner: 'org',
        repo: 'repo-ios',
        scoreData: [
          {
            userId: 'global-dev',
            prFeatureBug: 1,
            prDocs: 0,
            prTypo: 0,
            issueFeatureBug: 3,
            issueDocs: 0,
          },
        ],
      };

      const finalScores = ScoreCalculator.calculateUserScores([repoA, repoB]);

      expect(finalScores).toHaveLength(1);

      const finalScore = finalScores[0]!;
      expect(finalScore.userId).toBe('global-dev');
      expect(finalScore.totalScore).toBe(16);
      expect(finalScore.repoScores).toHaveLength(2);
    });

    test('서로 다른 사용자의 데이터는 합산되지 않고 고유한 로우(Row)로 유지되어야 한다', () => {
      const repoData: RepoData = {
        owner: 'org',
        repo: 'main-repo',
        scoreData: [
          {
            userId: 'alpha',
            prFeatureBug: 1,
            prDocs: 0,
            prTypo: 0,
            issueFeatureBug: 0,
            issueDocs: 0,
          },
          {
            userId: 'beta',
            prFeatureBug: 2,
            prDocs: 0,
            prTypo: 0,
            issueFeatureBug: 0,
            issueDocs: 0,
          },
        ],
      };

      const finalScores = ScoreCalculator.calculateUserScores([repoData]);
      expect(finalScores).toHaveLength(2);

      const alphaUser = finalScores.find(u => u.userId === 'alpha');
      const betaUser = finalScores.find(u => u.userId === 'beta');

      expect(alphaUser!.totalScore).toBe(3);
      expect(betaUser!.totalScore).toBe(6);
    });
  });
});
