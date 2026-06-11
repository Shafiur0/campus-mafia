import { describe, it, expect, vi } from 'vitest';
import { distributeRoles, checkWinConditions } from './gameEngine';
import { prisma } from '@campus-mafia/db';

vi.mock('@campus-mafia/db', () => ({
  prisma: {
    roomPlayer: {
      findMany: vi.fn(),
    },
  },
}));

describe('gameEngine - distributeRoles', () => {
  it('should distribute correct roles for 3 players', () => {
    const roles = distributeRoles(3);
    expect(roles).toHaveLength(3);
    expect(roles.filter(r => r === 'ASSIGNMENT_MAFIA')).toHaveLength(1);
    expect(roles.filter(r => r === 'TEACHER')).toHaveLength(1);
    expect(roles.filter(r => r === 'STUDENT')).toHaveLength(1);
  });

  it('should distribute correct roles for 5 players', () => {
    const roles = distributeRoles(5);
    expect(roles).toHaveLength(5);
    expect(roles.filter(r => r === 'ASSIGNMENT_MAFIA')).toHaveLength(1);
    expect(roles.filter(r => r === 'TEACHER')).toHaveLength(1);
    expect(roles.filter(r => r === 'STUDENT')).toHaveLength(3);
  });

  it('should distribute correct roles for 8 players', () => {
    const roles = distributeRoles(8);
    expect(roles).toHaveLength(8);
    expect(roles.filter(r => r === 'ASSIGNMENT_MAFIA')).toHaveLength(2);
    expect(roles.filter(r => r === 'TEACHER')).toHaveLength(1);
    expect(roles.filter(r => r === 'ATTENDANCE_POLICE')).toHaveLength(1);
    expect(roles.filter(r => r === 'STUDENT')).toHaveLength(4);
  });

  it('should distribute correct roles for 11 players', () => {
    const roles = distributeRoles(11);
    expect(roles).toHaveLength(11);
    expect(roles.filter(r => r === 'ASSIGNMENT_MAFIA')).toHaveLength(3);
    expect(roles.filter(r => r === 'TEACHER')).toHaveLength(1);
    expect(roles.filter(r => r === 'ATTENDANCE_POLICE')).toHaveLength(1);
    expect(roles.filter(r => r === 'CR')).toHaveLength(1);
    expect(roles.filter(r => r === 'CANTEEN_SPY')).toHaveLength(1);
    expect(roles.filter(r => r === 'CHATGPT_HELPER')).toHaveLength(1);
    expect(roles.filter(r => r === 'STUDENT')).toHaveLength(3);
  });
});

describe('gameEngine - checkWinConditions', () => {
  it('should return STUDENTS when all mafia are dead', async () => {
    // Mock database response where there is no ASSIGNMENT_MAFIA alive
    vi.mocked(prisma.roomPlayer.findMany).mockResolvedValue([
      { id: '1', roomId: 'r1', userId: 'u1', role: 'STUDENT', isAlive: true, isReady: true },
      { id: '2', roomId: 'r1', userId: 'u2', role: 'TEACHER', isAlive: true, isReady: true },
    ] as any);

    const winner = await checkWinConditions('r1');
    expect(winner).toBe('STUDENTS');
  });

  it('should return MAFIA when mafia count is equal to or greater than students', async () => {
    // Mock 1 mafia, 1 student
    vi.mocked(prisma.roomPlayer.findMany).mockResolvedValue([
      { id: '1', roomId: 'r1', userId: 'u1', role: 'ASSIGNMENT_MAFIA', isAlive: true, isReady: true },
      { id: '2', roomId: 'r1', userId: 'u2', role: 'STUDENT', isAlive: true, isReady: true },
    ] as any);

    const winner = await checkWinConditions('r1');
    expect(winner).toBe('MAFIA');
  });

  it('should return null when game is still in progress', async () => {
    // Mock 1 mafia, 2 students
    vi.mocked(prisma.roomPlayer.findMany).mockResolvedValue([
      { id: '1', roomId: 'r1', userId: 'u1', role: 'ASSIGNMENT_MAFIA', isAlive: true, isReady: true },
      { id: '2', roomId: 'r1', userId: 'u2', role: 'STUDENT', isAlive: true, isReady: true },
      { id: '3', roomId: 'r1', userId: 'u3', role: 'TEACHER', isAlive: true, isReady: true },
    ] as any);

    const winner = await checkWinConditions('r1');
    expect(winner).toBeNull();
  });
});
