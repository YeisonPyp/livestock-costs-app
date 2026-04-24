// components/sale-create-drawer/sale-create-drawer.component.ts
//
// Componente presentacional puro que recibe estado del SaleFacade vía inject()
// y emite eventos para la page. No tiene su propia lógica HTTP.

import {
  Component, OnInit, ChangeDetectionStrategy,
  inject, output
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { SaleFacade } from '../../facades/sale.facade';
import { AnimalSelectionModalComponent } from '../../components/animal-selection-modal/animal-selection-modal.component';
import { WeightBulkImportComponent }     from '../../../cattle/pages/weights/weight-bulk-import/weight-bulk-import.component';
import { AlertComponent }                from '../../../../shared/components/feedback/alert/alert.component';
import { NotificationService }           from '../../../../core/services/notification.service';

import type { CreateSaleEventPayload } from '../../models/sale.model';

@Component({
  selector: 'app-sale-create-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AlertComponent, WeightBulkImportComponent],
  templateUrl: './sale-create-drawer.component.html',
  styleUrl:    './sale-create-drawer.component.scss',
})
export class SaleCreateDrawerComponent implements OnInit {

  readonly saved  = output<void>();
  readonly cancel = output<void>();

  readonly facade  = inject(SaleFacade);
  private  fb      = inject(FormBuilder);
  private  dialog  = inject(MatDialog);
  private  notify  = inject(NotificationService);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      saleDate:    [this.facade.today(), Validators.required],
      description: ['', Validators.required],
      buyerId:     [null],
      saleCosts:   [0, [Validators.min(0)]],
      notes:       [''],
      pricePerKg:  [null, [Validators.required, Validators.min(0.01)]],
    });

    this.form.get('pricePerKg')?.valueChanges
      .subscribe(v => this.facade.setPricePerKg(+v || 0));
    this.form.get('saleCosts')?.valueChanges
      .subscribe(v => this.facade.setSaleCosts(+v || 0));
  }

  openAnimalSelection(): void {
    this.dialog.open(AnimalSelectionModalComponent, {
      width: '95%', maxWidth: '1400px', maxHeight: '90vh',
    }).afterClosed().subscribe(result => {
      if (result?.animals) {
        this.facade.setAnimals(result.animals.map((a: any) => ({
          id:            a.id,
          tagNumber:     a.tag_number,
          name:          a.name,
          breedName:     a.breed_name,
          currentWeight: parseFloat(a.current_weight) || 0,
          investorCode:  a.investor_code,
        })));
      }
    });
  }

  onWeightAnimalsSelected(animals: any[]): void {
    this.facade.setAnimals(animals.map(a => ({
      id:            a.id,
      tagNumber:     a.tag_number,
      name:          a.name || '',
      breedName:     a.breed_name || '',
      currentWeight: a.current_weight,
      investorCode:  a.investor_code || undefined,
    })));
    this.facade.showWeightModal.set(false);
    this.notify.success(`${animals.length} animales cargados`);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw   = this.form.getRawValue();
    const price = +raw.pricePerKg;

    const payload: CreateSaleEventPayload = {
      saleDate:    raw.saleDate,
      description: raw.description,
      buyerId:     raw.buyerId || null,
      saleCosts:   raw.saleCosts || 0,
      items: this.facade.selectedAnimals().map(a => ({
        animalId:   a.id,
        weight:     +a.currentWeight.toFixed(2),
        pricePerKg: price,
      })),
    };

    this.facade.submitCreate(payload, () => this.saved.emit());
  }

  onCancel(): void { this.cancel.emit(); }

  formatWeight = (v: number) => this.facade.formatWeight(v);
}