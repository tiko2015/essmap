import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SobreEssappComponent } from './sobre-essapp.component';

describe('SobreEssappComponent', () => {
  let component: SobreEssappComponent;
  let fixture: ComponentFixture<SobreEssappComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SobreEssappComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SobreEssappComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
