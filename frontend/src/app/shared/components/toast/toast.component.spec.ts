import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to toast service', () => {
    expect(component.toastService).toBeTruthy();
  });

  it('should render toasts when present', () => {
    toastService.success('Test message');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test message');
  });

  it('should render nothing when no toasts', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const toastElements = el.querySelectorAll('[class*="toast-enter"]');
    expect(toastElements.length).toBe(0);
  });
});
