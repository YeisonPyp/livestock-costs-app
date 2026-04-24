// pages/investor/investor-form/investor-form.component.ts

import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal, computed
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { InvestorFacade } from '../../../facades/investor.facade';

import { PageHeaderComponent }     from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }         from '../../../../../shared/components/feedback/loader/loader.component';
import { FormCardComponent }       from '../../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent }     from '../../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../../shared/components/forms/select-field/select-field.component';
import { CheckboxToggleComponent } from '../../../../../shared/components/forms/checkbox-toggle/checkbox-toggle.component';
import { PersonSearchComponent }   from '../../../../users/components/person-search/person-search.component';
import type { PersonSimple }       from '../../../../users/models/user.model';
import { SaleDecisionType }        from '../../../models/enums';

@Component({
  selector: 'app-investor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestorFacade],
  imports: [
    RouterLink, ReactiveFormsModule,
    PageHeaderComponent, LoaderComponent, FormCardComponent,
    InputFieldComponent, SelectFieldComponent, CheckboxToggleComponent,
    PersonSearchComponent,
  ],
  templateUrl: './investor-form.component.html',
  styleUrl:    './investor-form.component.scss',
})
export class InvestorFormComponent implements OnInit {
  readonly facade = inject(InvestorFacade);
  private  fb     = inject(FormBuilder);
  private  route  = inject(ActivatedRoute);

  readonly investorId = signal<string | null>(null);
  readonly isEdit     = computed(() => !!this.investorId());
  readonly today      = new Date().toLocaleDateString('en-CA');

  readonly defaultDecisionOptions: SelectOption[] = Object.values(SaleDecisionType).map(v => ({
    value: v,
    label: this.labelForDecision(v),
  }));

  form!: FormGroup;

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.buildForm();
    this.syncOperatorPercentage();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.investorId.set(id);
      this.facade.loadInvestorForEdit(id, (data) => {
        this.form.patchValue({
          joinedDate:           data.joinedDate,
          defaultSaleDecision:  data.defaultSaleDecision,
          notifySales:          data.notifySales,
          notifyWeightGains:    data.notifyWeightGains,
          isActive:             data.isActive,
          notes:                data.notes,
          investorPercentage:   data.currentInvestorPercentage ?? 60,
        });
      });
    }
  }

  onPersonSelected(person: PersonSimple): void {
    this.form.get('personId')?.setValue(person.id);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const raw = this.form.getRawValue();
    const id  = this.investorId();

    if (id) {
      this.facade.updateInvestor(id, {
        notifySales:         raw.notifySales,
        notifyWeightGains:   raw.notifyWeightGains,
        defaultSaleDecision: raw.defaultSaleDecision,
        notes:               raw.notes,
      });
    } else {
      this.facade.createInvestor({
        personId:            raw.personId,
        joinedDate:          raw.joinedDate,
        notifySales:         raw.notifySales,
        notifyWeightGains:   raw.notifyWeightGains,
        defaultSaleDecision: raw.defaultSaleDecision,
        notes:               raw.notes,
      });
    }
  }

  // ── Helpers privados ──────────────────────────────────────

  private buildForm(): void {
    this.form = this.fb.group({
      personId:           ['', Validators.required],
      joinedDate:         [this.today, Validators.required],
      investorPercentage: [60, [Validators.required, Validators.min(0), Validators.max(100)]],
      operatorPercentage: [{ value: 40, disabled: true }],
      notifySales:        [true],
      notifyWeightGains:  [false],
      defaultSaleDecision:['pending'],
      isActive:           [true],
      notes:              [''],
    });
  }

  private syncOperatorPercentage(): void {
    this.form.get('investorPercentage')?.valueChanges.subscribe(val => {
      const v = Number(val) || 0;
      if (v >= 0 && v <= 100) {
        this.form.get('operatorPercentage')?.setValue(100 - v, { emitEvent: false });
      }
    });
  }

  private labelForDecision(value: string): string {
    const labels: Record<string, string> = {
      [SaleDecisionType.PENDING]:         'Pendiente',
      [SaleDecisionType.REINVEST]:        'Reinvertir',
      [SaleDecisionType.WITHDRAW]:        'Retirar',
      [SaleDecisionType.PARTIAL]:         'Parcial',
      [SaleDecisionType.FULL_WITHDRAWAL]: 'Retiro total',
    };
    return labels[value] ?? value;
  }
}