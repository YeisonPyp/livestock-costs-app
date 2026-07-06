// pages/sale-decision-detail/sale-decision-detail.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SaleFacade } from '../../../facades/sale.facade';
import { DecisionOptionsComponent } from '../../../components/decision-options/decision-options.component';

import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { AlertComponent }         from '../../../../../shared/components/feedback/alert/alert.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { SaleDecisionType }       from '../../../models/enums';

@Component({
  selector: 'app-sale-decision-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SaleFacade],
  imports: [
    RouterLink, ReactiveFormsModule,
    PageHeaderComponent, LoaderComponent, BadgeComponent,
    AlertComponent, AmountDisplayComponent, DecisionOptionsComponent,
  ],
  templateUrl: './sale-decision-detail.component.html',
  styleUrl:    './sale-decision-detail.component.scss',
})
export class SaleDecisionDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(SaleFacade);
  private  route  = inject(ActivatedRoute);
  private  fb     = inject(FormBuilder);

  readonly SaleDecisionType = SaleDecisionType;

  // Formulario para decisión parcial
  readonly partialForm = this.fb.group({
    reinvestAmount: [0, [Validators.required, Validators.min(0)]],
    withdrawAmount: [{ value: 0, disabled: true }],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadDecision(id);

    // Sincronizar monto de retiro automáticamente
    this.partialForm.get('reinvestAmount')?.valueChanges.subscribe(v => {
      const total    = facade_parseDecimal(this.facade.decision()?.investorAmount ?? '0');
      const reinvest = +(v ?? 0);
      this.partialForm.get('withdrawAmount')?.setValue(
        Number(Math.max(0, total - reinvest).toFixed(2)),
        { emitEvent: false }
      );
    });
  }

  ngOnDestroy(): void { this.facade.clearDecisionState(); }

  onSelectType(type: SaleDecisionType): void {
    this.facade.selectDecisionType(type);
    if (type === SaleDecisionType.PARTIAL) this.partialForm.reset({ reinvestAmount: 0 });
  }

  onConfirm(): void {
    const type = this.facade.selectedType();
    if (!type) return;

    if (type === SaleDecisionType.PARTIAL) {
      if (this.partialForm.invalid) { this.partialForm.markAllAsTouched(); return; }
      const raw = this.partialForm.getRawValue();
      this.facade.confirmDecision({
        decisionType:   SaleDecisionType.PARTIAL,
        reinvestAmount: +(raw.reinvestAmount ?? 0),
        withdrawAmount: +(raw.withdrawAmount ?? 0),
      });
    } else {
      this.facade.confirmDecision({ decisionType: type });
    }
  }
}

// Helper local (evita importar de core en el template)
function facade_parseDecimal(v: string | number): number {
  return typeof v === 'number' ? v : parseFloat(v) || 0;
}