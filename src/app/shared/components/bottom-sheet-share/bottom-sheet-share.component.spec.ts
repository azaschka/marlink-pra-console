import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { BottomSheetShareComponent } from './bottom-sheet-share.component';

describe('BottomSheetShareComponent', () => {
  let component: BottomSheetShareComponent;
  let fixture: ComponentFixture<BottomSheetShareComponent>;
  let bottomSheetRefSpy: jasmine.SpyObj<MatBottomSheetRef<BottomSheetShareComponent>>;

  beforeEach(waitForAsync(() => {
    bottomSheetRefSpy = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

    TestBed.configureTestingModule({
      declarations: [BottomSheetShareComponent],
      providers: [
        { provide: MatBottomSheetRef, useValue: bottomSheetRefSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideTemplate(BottomSheetShareComponent, '')
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomSheetShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
