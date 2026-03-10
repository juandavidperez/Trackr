import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast with show()', () => {
    service.show('Hello', 'info');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Hello');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should add a success toast', () => {
    service.success('Done!');
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Done!');
  });

  it('should add an error toast', () => {
    service.error('Failed!');
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].message).toBe('Failed!');
  });

  it('should dismiss a toast by id', () => {
    service.show('First', 'info');
    service.show('Second', 'info');
    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Second');
  });

  it('should auto-dismiss after duration', () => {
    service.show('Auto', 'info', 1000);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(service.toasts().length).toBe(0);
  });

  it('should assign unique ids', () => {
    service.show('A', 'info');
    service.show('B', 'info');
    const ids = service.toasts().map((t) => t.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
