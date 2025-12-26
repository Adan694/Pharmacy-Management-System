import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pharmacistsales } from './pharmacistsales';

describe('Pharmacistsales', () => {
  let component: Pharmacistsales;
  let fixture: ComponentFixture<Pharmacistsales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pharmacistsales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pharmacistsales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
