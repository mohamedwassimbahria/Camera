import { TestBed } from '@angular/core/testing';
import { CameraComponent } from './camera.component';

describe('CameraComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CameraComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});