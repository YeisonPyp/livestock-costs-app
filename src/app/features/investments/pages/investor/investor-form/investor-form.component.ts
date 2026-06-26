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
import { AlertComponent } from '../../../../../shared/components/feedback/alert/alert.component';

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
    AlertComponent,
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

  // ✅ Persona seleccionada (para el input initialPerson del search)
  readonly selectedPerson = signal<PersonSimple | null>(null);

  readonly defaultDecisionOptions: SelectOption[] = Object.values(SaleDecisionType).map(v => ({
    value: v,
    label: this.labelForDecision(v),
  }));

  form!: FormGroup;

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.buildForm();

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

        // ✅ Si viene con persona, precargarla en el search
        // if (data.person) {
        //   this.selectedPerson.set(data.person);
        //   this.form.get('personId')?.setValue(data.person.id);
        // }
      });
    }
  }

  // ── PersonSearch handlers ─────────────────────────────────────

  onPersonSelected(person: PersonSimple): void {
    const personId = person.id;

    this.selectedPerson.set(person);
    this.form.get('personId')?.setValue(personId);
    this.form.get('personId')?.markAsTouched();

    if (personId) {
      this.facade.checkInvestorExistence(personId);
    } else {
      this.facade.hasInvestorExistence.set(false);
    }
  }

  // ✅ NUEVO: handler cuando el usuario limpia la selección
  onPersonCleared(): void {
    this.selectedPerson.set(null);
    this.form.get('personId')?.setValue('');
    this.form.get('personId')?.markAsTouched();
    this.facade.hasInvestorExistence.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // ✅ Bloquear si ya existe como inversionista
    if (this.facade.hasInvestorExistence()) {
      return;
    }

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
      notifySales:        [true],
      notifyWeightGains:  [false],
      defaultSaleDecision:['pending'],
      isActive:           [true],
      notes:              [''],
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