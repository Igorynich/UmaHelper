import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    AsyncPipe
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  protected authService = inject(AuthService);
}
