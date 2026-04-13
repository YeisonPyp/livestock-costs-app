import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoginRequest } from '../../models/login-request.interface'; // ← tu interface

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  capsLockOn = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password:   ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.notificationService.error('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading = true;

    // Armamos el objeto LoginRequest tal como lo espera tu service
    const credentials: LoginRequest = {
      identifier: this.loginForm.value.identifier,
      password:   this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.notificationService.success('¡Bienvenido! Inicio de sesión exitoso');
        this.redirectByRole();
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error?.error?.message
          || 'Credenciales incorrectas. Por favor verifica tus datos.';
        this.notificationService.error(errorMessage);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private redirectByRole(): void {
    if (this.authService.isInvestor()) {
      this.router.navigate(['/investor/dashboard']);
    } else {
      this.router.navigate(['/dashboard']); // admin, super_admin, etc.
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onPasswordKeyPress(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState?.('CapsLock') ?? false;
  }

  get identifier()  { return this.loginForm.get('identifier'); }
  get password()    { return this.loginForm.get('password'); }

  get identifierHasError(): boolean {
    return !!(this.identifier?.invalid && this.identifier?.touched);
  }

  get passwordHasError(): boolean {
    return !!(this.password?.invalid && this.password?.touched);
  }
}