import {describe, expect, test} from 'bun:test';

import {sortUserScores} from '../src/sort';
import type {UserScore} from '../src/score-calculator';

const createUserScore = (userId: string, totalScore: number): UserScore => ({
  userId,
  totalScore,
  repoScores: [],
});

describe('sortUserScores', () => {
  const users: UserScore[] = [
    createUserScore('kim', 10),
    createUserScore('lee', 20),
    createUserScore('park', 10),
    createUserScore('choi', 30),
  ];

  test('score 기준 내림차순으로 정렬한다', () => {
    const result = sortUserScores(users, 'score', 'desc');

    expect(result.map(user => user.userId)).toEqual([
      'choi',
      'lee',
      'kim',
      'park',
    ]);
  });

  test('score 기준 오름차순으로 정렬한다', () => {
    const result = sortUserScores(users, 'score', 'asc');

    expect(result.map(user => user.userId)).toEqual([
      'kim',
      'park',
      'lee',
      'choi',
    ]);
  });

  test('score 기준 정렬에서 점수가 같으면 userId 오름차순으로 2차 정렬한다', () => {
    const tiedUsers: UserScore[] = [
      createUserScore('park', 10),
      createUserScore('lee', 20),
      createUserScore('kim', 10),
    ];

    const result = sortUserScores(tiedUsers, 'score', 'desc');

    expect(result.map(user => user.userId)).toEqual(['lee', 'kim', 'park']);
  });

  test('id 기준 오름차순으로 정렬한다', () => {
    const result = sortUserScores(users, 'id', 'asc');

    expect(result.map(user => user.userId)).toEqual([
      'choi',
      'kim',
      'lee',
      'park',
    ]);
  });

  test('id 기준 내림차순으로 정렬한다', () => {
    const result = sortUserScores(users, 'id', 'desc');

    expect(result.map(user => user.userId)).toEqual([
      'park',
      'lee',
      'kim',
      'choi',
    ]);
  });

  test('원본 배열을 변경하지 않는다', () => {
    const originalUsers: UserScore[] = [
      createUserScore('kim', 10),
      createUserScore('lee', 20),
      createUserScore('park', 10),
    ];

    const originalOrder = originalUsers.map(user => user.userId);
    const result = sortUserScores(originalUsers, 'score', 'desc');

    expect(result.map(user => user.userId)).toEqual(['lee', 'kim', 'park']);
    expect(originalUsers.map(user => user.userId)).toEqual(originalOrder);
  });
});
