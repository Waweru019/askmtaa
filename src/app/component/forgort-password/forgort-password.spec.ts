import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgortPassword } from './forgort-password';

describe('ForgortPassword', () => {
  let component: ForgortPassword;
  let fixture: ComponentFixture<ForgortPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgortPassword],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgortPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
