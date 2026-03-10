import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskFormModalComponent } from './task-form-modal.component';
import { ComponentRef } from '@angular/core';

describe('TaskFormModalComponent', () => {
  let component: TaskFormModalComponent;
  let componentRef: ComponentRef<TaskFormModalComponent>;
  let fixture: ComponentFixture<TaskFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFormModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormModalComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a form with required fields', () => {
    expect(component.form.get('title')).toBeTruthy();
    expect(component.form.get('description')).toBeTruthy();
    expect(component.form.get('status')).toBeTruthy();
    expect(component.form.get('priority')).toBeTruthy();
    expect(component.form.get('assigneeId')).toBeTruthy();
    expect(component.form.get('dueDate')).toBeTruthy();
  });

  it('should default to create mode', () => {
    expect(component.isEdit()).toBe(false);
    expect(component.heading()).toBe('Create Task');
  });

  it('should show edit heading in edit mode', () => {
    componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    expect(component.isEdit()).toBe(true);
    expect(component.heading()).toBe('Edit Task');
  });

  it('should require title', () => {
    component.form.patchValue({ title: '' });
    expect(component.form.valid).toBe(false);
    component.form.patchValue({ title: 'A task' });
    expect(component.form.valid).toBe(true);
  });

  it('should emit save on valid submit', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.form.patchValue({ title: 'Test task', status: 'TODO', priority: 'HIGH' });
    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test task', status: 'TODO', priority: 'HIGH' }),
    );
  });

  it('should not emit save on invalid submit', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.form.patchValue({ title: '' });
    component.onSubmit();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should emit close', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should not render when not visible', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('form')).toBeNull();
  });

  it('should render form when visible', () => {
    componentRef.setInput('visible', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('form')).toBeTruthy();
  });
});
