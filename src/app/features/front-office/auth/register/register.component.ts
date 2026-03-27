import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthLeftPanelComponent } from '../auth-left-panel/auth-left-panel.component';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserService } from '../user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLeftPanelComponent, LUCIDE_ICONS, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  constructor(private userService: UserService) {}

 

  fullName = '';
  firstName = '';
  lastName = '';
  email = '';
  headline = '';
  location = '';
  password = '';
  githubUrl = '';
  linkedinUrl = '';
  acceptTerms = false;
  nameTouched = false;
  headlineTouched = false;
  locationTouched = false;
  githubTouched = false;
  lastNameTouched = false;
  linkedinTouched = false;
  
  emailTouched = false;
  passwordTouched = false;

  selectedRole = signal<'candidate' | 'recruiter'>('candidate');
  showPassword = signal(false);
  isLoading = signal(false);
  passwordStrength = signal(0);

  strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  });

  isEmailValid(): boolean {
    if (!this.email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
  }
}

  hasUppercase(): boolean { return /[A-Z]/.test(this.password); }
  hasNumber(): boolean { return /[0-9]/.test(this.password); }
  hasSpecial(): boolean { return /[^A-Za-z0-9]/.test(this.password); }

  onPasswordInput(): void {
    let strength = 0;
    if (this.password.length >= 8) strength++;
    if (this.hasUppercase()) strength++;
    if (this.hasNumber()) strength++;
    if (this.hasSpecial()) strength++;
    this.passwordStrength.set(strength);
  }

  private createUserAndProfile(userRequest: any, profileRequest: any): void {

    this.userService.createUser(userRequest, profileRequest).subscribe({
            next: (responseUser) => {
              console.log('User created:', responseUser);
              this.isLoading.set(false);
            },
            error: (error) => {
              console.error('Error creating user:', error);
              this.isLoading.set(false);
            }
    });
  }


  onSubmit(): void {
    this.nameTouched = true;
    this.emailTouched = true;
    this.passwordTouched = true;
    if (
      !this.firstName.trim() || 
      !this.isEmailValid() ||
      !this.password ||
      !this.acceptTerms
    ) return;



    this.isLoading.set(true);
    console.log(this.selectedRole());
    let userRequest =  {
      email: this.email, 
      password: this.password,
      roleName: this.selectedRole()
    }

    let profileRequest =  {
      firstName: this.firstName,
      lastName: this.lastName,
      headline: this.headline,
      location: this.location,
      githubUrl: this.githubUrl,
      linkedinUrl: this.linkedinUrl
    }
    this.createUserAndProfile(userRequest, profileRequest);
    
   
  }

  oauthSignup(provider: string): void {
    console.log('OAuth signup with:', provider);
    
  }
}
