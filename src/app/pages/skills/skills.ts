import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {SkillsService} from '../../services/skills.service';
import {Skill} from '../../interfaces/skill';
import {debounceTime, distinctUntilChanged, first, map, tap} from 'rxjs';
import {ImagekitioAngularModule} from 'imagekitio-angular';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {SkillDialogComponent} from '../../components/common/skill-dialog/skill-dialog';
import {MatIconButton} from '@angular/material/button';
import {SpinnerService} from '../../services/spinner';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ImagekitioAngularModule,
    MatIconModule,
    MatDialogModule,
    MatIconButton,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './skills.html',
  styleUrl: './skills.css',
})
export class SkillsComponent {
  private skillsService = inject(SkillsService);
  private dialog = inject(MatDialog);
  private spinnerService = inject(SpinnerService);

  filterControl = new FormControl('');
  private filter$ = toSignal(this.filterControl.valueChanges.pipe(
    debounceTime(200),
    distinctUntilChanged(),
  ), {initialValue: ''});

  private skills = signal<Skill[]>([]);
  filteredSkills = computed(() => {
    const filter = this.filter$()?.toLowerCase() || '';
    return this.skills().filter(skill => (skill.name_en ?? skill.enname).toLowerCase().includes(filter));
  });


  constructor() {
    this.spinnerService.show();
    this.skillsService.getSkills().pipe(
      // map(skills => skills.sort((a, b) => a.enname.localeCompare(b.enname))),
      map(skills => skills.sort((a, b) => a.iconid - b.iconid)),
      first(),
      tap(skills => {
        this.skills.set(skills);
        console.log('Skills', skills);
        this.spinnerService.hide();
        skills.forEach(skill => {         // Debug
          // this.openSkillDialog(skill, true);
        });
      }),
    ).subscribe();
  }

  openSkillDialog(skill: Skill, closeAfter = false) {
    const dialog = this.dialog.open(SkillDialogComponent, {
      data: {
        skill,
        props: Object.keys(skill),
        displayedProps: ['desc_en', 'endesc', 'rarity', 'activation', 'cost'],
        // excludedProps: ['jpdesc', 'desc_ko', 'name_ko', 'name_tw', 'desc_tw', 'jpname']
      }
    });
    if (closeAfter) {
      dialog.close();      // Debug
    }
  }

  clearFilter() {
    this.filterControl.setValue('');
  }
}
