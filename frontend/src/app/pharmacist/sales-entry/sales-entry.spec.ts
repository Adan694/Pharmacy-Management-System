import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesEntry } from './sales-entry';

describe('SalesEntry', () => {
  let component: SalesEntry;
  let fixture: ComponentFixture<SalesEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
