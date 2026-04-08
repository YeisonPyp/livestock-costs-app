import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }  from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }       from '../../../../../shared/components/loader/loader.component';
import { FormCardComponent }     from '../../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent }   from '../../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../../shared/components/forms/select-field/select-field.component';
import { CheckboxToggleComponent } from '../../../../../shared/components/forms/checkbox-toggle/checkbox-toggle.component';
import { PersonSearchComponent } from '../../../../users/components/person-search/person-search.component'
import { PersonSimple } from "../../../../users/models/user.model"

import { InvestmentService } from '../../../services/investment.service';
import { SALE_DECISION_TYPES } from '../../../models/investment.model';

@Component({
  selector: 'app-investor-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    PageHeaderComponent, LoaderComponent, FormCardComponent,
    InputFieldComponent, SelectFieldComponent, CheckboxToggleComponent,
    PersonSearchComponent
  ],
  templateUrl: './investor-form.component.html',
  styleUrl:    './investor-form.component.scss',
})
export class InvestorFormComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);
  private svc     = inject(InvestmentService);
  private snack   = inject(MatSnackBar);

  form!: FormGroup;
  loading    = signal(false);
  saving     = signal(false);
  isEdit     = signal(false);
  investorId = signal<string | null>(null);

  defaultDecisionOptions: SelectOption[] = SALE_DECISION_TYPES.map(d => ({ label: d.label, value: d.value }));

  today = new Date().toLocaleDateString('en-CA');

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.buildForm();
    this.handlePercentageChanges();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.isEdit.set(true); this.investorId.set(id); this.loadInvestor(id); }
  }

  onPersonSelected(person: PersonSimple): void {
    this.form.get('person_id')?.setValue(person.id);
  }

  private handlePercentageChanges(): void {
    this.form.get('investor_percentage')?.valueChanges.subscribe(value => {
      const investor = Number(value) || 0;

      // Limitar entre 0 y 100
      if (investor < 0 || investor > 100) return;

      const operator = 100 - investor;

      this.form.get('operator_percentage')?.setValue(operator, {
        emitEvent: false // 🔥 evita loop infinito
      });
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // person UUID — in real app this would be a person-selector component
      person_id:              ['', Validators.required],
      joined_date:            [this.today, Validators.required],
      investor_percentage:    [60, [Validators.required, Validators.min(0), Validators.max(100)]],
      operator_percentage:    [{ value: 40, disabled: true }],
      notify_sales:           [true],
      notify_weight_gains:    [false],
      default_sale_decision:  ['pending'],
      is_active:              [true],
      notes:                  [''],
    });
  }

  private loadInvestor(id: string): void {
    this.loading.set(true);
    this.svc.getInvestor(id).subscribe({
      next: (res) => { if (res.success) this.form.patchValue(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snack.open('Error al cargar el inversionista', 'Cerrar', { duration: 3000 }); this.router.navigate(['/investments/investors']); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const req$ = this.isEdit()
      ? this.svc.updateInvestor(this.investorId()!, this.form.getRawValue())
      : this.svc.createInvestor(this.form.getRawValue());

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open(this.isEdit() ? 'Inversionista actualizado' : 'Inversionista creado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/investments/investors']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.message || 'Error al guardar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}