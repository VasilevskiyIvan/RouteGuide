import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedPageComponent } from './saved-page.component';

describe('SavedPageComponent', () => {
  let component: SavedPageComponent;
  let fixture: ComponentFixture<SavedPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
