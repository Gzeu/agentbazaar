import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { NotFoundException } from '@nestjs/common';

const mockRep = { updateFromTask: jest.fn() };
const mockSvc = { incrementTaskStats: jest.fn() };

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
    service.setDependencies(mockRep, mockSvc);
    service.onModuleInit();
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all 3 seeded tasks', () => {
      const result = service.findAll({ limit: 10 });
      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.nextCursor).toBeNull();
    });

    it('filters by status=completed', () => {
      const result = service.findAll({ limit: 10, status: 'completed' });
      expect(result.data.every(t => t.status === 'completed')).toBe(true);
    });

    it('cursor pagination works', () => {
      const page1 = service.findAll({ limit: 2 });
      expect(page1.data.length).toBe(2);
      expect(page1.nextCursor).not.toBeNull();

      const page2 = service.findAll({ limit: 2, after: page1.nextCursor! });
      expect(page2.data.length).toBe(1);
      expect(page2.nextCursor).toBeNull();
    });
  });

  // ─── create ───────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a task with status=pending', () => {
      const task = service.create({
        serviceId:       'svc-test',
        consumerId:      'erd1consumer',
        providerAddress: 'erd1provider',
        maxBudget:       '1000000000000000',
      });
      expect(task.status).toBe('pending');
      expect(task.id).toMatch(/^task-/);
    });

    it('throws on duplicate explicit ID', () => {
      const dto = {
        id:              'task-dup-test',
        serviceId:       'svc-test',
        consumerId:      'erd1consumer',
        providerAddress: 'erd1provider',
        maxBudget:       '1000000000000000',
      };
      service.create(dto);
      expect(() => service.create(dto)).toThrow('task-dup-test already exists');
    });
  });

  // ─── complete ─────────────────────────────────────────────────────

  describe('complete', () => {
    it('marks running task completed and wires deps', () => {
      const task = service.complete('task-demo-002', {
        proofHash: '0xabcdef',
        latencyMs: 250,
      });
      expect(task.status).toBe('completed');
      expect(task.proofHash).toBe('0xabcdef');
      expect(task.latencyMs).toBe(250);
      expect(mockRep.updateFromTask).toHaveBeenCalledWith('erd1provider', true, 250);
      expect(mockSvc.incrementTaskStats).toHaveBeenCalledWith('svc-demo', true, 250);
    });

    it('throws when task is already completed', () => {
      expect(() =>
        service.complete('task-demo-001', { proofHash: '0x', latencyMs: 100 }),
      ).toThrow('Cannot complete task in status: completed');
    });

    it('throws NotFoundException for unknown task', () => {
      expect(() =>
        service.complete('nonexistent', { proofHash: '0x', latencyMs: 0 }),
      ).toThrow(NotFoundException);
    });
  });

  // ─── dispute ──────────────────────────────────────────────────────

  describe('dispute', () => {
    it('opens dispute on a pending task', () => {
      const task = service.dispute('task-demo-003', 'Provider timeout');
      expect(task.status).toBe('disputed');
      expect(task.disputeReason).toBe('Provider timeout');
    });

    it('opens dispute on a completed task', () => {
      const task = service.dispute('task-demo-001', 'Wrong result');
      expect(task.status).toBe('disputed');
    });

    it('throws when task is already refunded', () => {
      const t = service.findOne('task-demo-003');
      (t as unknown as { status: string }).status = 'refunded';
      expect(() => service.dispute('task-demo-003', 'test'))
        .toThrow('Cannot dispute task in status: refunded');
    });

    it('throws NotFoundException for unknown task', () => {
      expect(() => service.dispute('nope', 'reason')).toThrow(NotFoundException);
    });
  });

  // ─── refund ───────────────────────────────────────────────────────

  describe('refund', () => {
    it('throws when deadline not yet reached', () => {
      expect(() => service.refund('task-demo-003'))
        .toThrow('Task deadline not reached yet');
    });

    it('refunds pending task past deadline and wires deps', () => {
      const t = service.findOne('task-demo-003');
      t.deadline = new Date(Date.now() - 1000).toISOString();
      const result = service.refund('task-demo-003');
      expect(result.status).toBe('refunded');
      expect(mockRep.updateFromTask).toHaveBeenCalledWith('erd1provider', false);
      expect(mockSvc.incrementTaskStats).toHaveBeenCalledWith('svc-demo', false);
    });

    it('throws when task is not pending', () => {
      expect(() => service.refund('task-demo-002'))
        .toThrow('Cannot refund task in status: running');
    });

    it('throws NotFoundException for unknown task', () => {
      expect(() => service.refund('nope')).toThrow(NotFoundException);
    });
  });
});
