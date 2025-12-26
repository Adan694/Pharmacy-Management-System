import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmPurchase } from './pharm-purchase';

describe('PharmPurchase', () => {
  let component: PharmPurchase;
  let fixture: ComponentFixture<PharmPurchase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmPurchase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PharmPurchase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
