import { TestBed } from '@angular/core/testing';
import { MediaLibraryComponent } from './media-library.component';

describe('MediaLibraryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaLibraryComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MediaLibraryComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});