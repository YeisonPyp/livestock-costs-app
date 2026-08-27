import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal, effect
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

  // Formulario reactivo para la decisión parcial (Retirar del Neto)
  readonly partialForm = this.fb.group({
    withdrawAmount: [0, [Validators.required, Validators.min(0)]],
  });

  // Señal reactiva para mostrar en tiempo real cuánto se reinvertirá
  readonly calculatedReinvest = signal(0);

  constructor() {
    // Reaccionar cuando cambie el Neto a decidir para actualizar dinámicamente las validaciones
    effect(() => {
      const net = this.facade.netValueToDecide();
      const withdrawCtrl = this.partialForm.get('withdrawAmount');
      if (withdrawCtrl) {
        withdrawCtrl.setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(net)
        ]);
        withdrawCtrl.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadDecision(id);

    // Sincronizar reactivamente el monto simulado de reinversión
    this.partialForm.get('withdrawAmount')?.valueChanges.subscribe(v => {
      const net = this.facade.netValueToDecide();
      const withdraw = +(v ?? 0);
      this.calculatedReinvest.set(Number(Math.max(0, net - withdraw).toFixed(2)));
    });
  }

  ngOnDestroy(): void { 
    this.facade.clearDecisionState(); 
  }

  onSelectType(type: SaleDecisionType): void {
    this.facade.selectDecisionType(type);
    if (type === SaleDecisionType.PARTIAL) {
      this.partialForm.reset({ withdrawAmount: 0 });
      this.calculatedReinvest.set(this.facade.netValueToDecide());
    }
  }

  onConfirm(): void {
    const type = this.facade.selectedType();
    if (!type) return;

    if (type === SaleDecisionType.PARTIAL) {
      if (this.partialForm.invalid) { 
        this.partialForm.markAllAsTouched(); 
        return; 
      }
      const raw = this.partialForm.getRawValue();
      this.facade.confirmDecision({
        decisionType:   SaleDecisionType.PARTIAL,
        withdrawAmount: +(raw.withdrawAmount ?? 0),
      });
    } else {
      this.facade.confirmDecision({ decisionType: type });
    }
  }
}