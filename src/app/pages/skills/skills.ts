import {MatSelectModule} from '@angular/material/select';
import {MatOptionModule} from '@angular/material/core';
import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {SkillsService} from '../../services/skills.service';
import {Skill} from '../../interfaces/skill';
import {debounceTime, distinctUntilChanged, first, map, tap} from 'rxjs';
import {ImagekitioAngularModule} from 'imagekitio-angular';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {SpinnerService} from '../../services/spinner';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {toSignal} from '@angular/core/rxjs-interop';
import { SkillDisplay } from '../../components/common/skill-display/skill-display';
import { matchesNameFilter } from '../../utils/name-filter.utils';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ImagekitioAngularModule,
    MatIconModule,
    MatIconButton,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    SkillDisplay,
  ],
  templateUrl: './skills.html',
  styleUrl: './skills.css',
})
export class SkillsComponent {
  private skillsService = inject(SkillsService);
  private spinnerService = inject(SpinnerService);

  readonly typeFilters = [
    {
      name: 'Strategy',
      values: [{
        name: 'Any',
        value: 'nac'
      }, {
        name: 'Front Runner',
        value: 'run'
      }, {
        name: 'Pace Chaser',
        value: 'ldr'
      }, {
        name: 'Late Surger',
        value: 'btw'
      }, {
        name: 'End Closer',
        value: 'cha'
      }]
    },
    {
      name: 'Distance',
      values: [{
        name: 'Sprint',
        value: 'sho'
      }, {
        name: 'Mile',
        value: 'mil'
      }, {
        name: 'Medium',
        value: 'med'
      }, {
        name: 'Long',
        value: 'lng'
      }]
    },
    {
      name: 'Surface',
      values: [{
        name: 'Turf',
        value: 'tur'
      }, {
        name: 'Dirt',
        value: 'dir'
      }]
    },
    {
      name: 'Part of the Race',
      values: [{
        name: 'Early Race',
        value: 'l_0'
      }, {
        name: 'Mid Race',
        value: 'l_1'
      }, {
        name: 'Late Race',
        value: 'l_2'
      }, {
        name: 'Last Spurt',
        value: 'l_3'
      }]
    },
    {
      name: 'Track Section',
      values: [{
        name: 'Corner',
        value: 'cor'
      }, {
        name: 'Final Corner',
        value: 'f_c'
      }, {
        name: 'Straight',
        value: 'str'
      }, {
        name: 'Final Straight',
        value: 'f_s'
      }, {
        name: 'Slope',
        value: 'slo'
      }]
    },
    {
      name: 'Skill Type',
      values: [{
        name: 'Debuff',
        value: 'dbf'
      }]
    }
  ];
  /*readonly skillTypeMap = {
    btw: "Late Surger",
    cha: "End Closer",
    cor: "Corner",
    dbf: "Debuff",
    dir: "Dirt",
    f_c: "Final Corner",
    f_s: "Final Straight",
    l_0: "Early Race",
    l_1: "Mid Race",
    l_2: "Late Race",
    l_3: "Last Spurt",
    ldr: "Pace Chaser",
    lng: "Long",
    med: "Medium",
    mil: "Mile",
    nac: "Any Strategy",
    run: "Front Runner",
    sho: "Sprint",
    slo: "Slope",
    str: "Straight",
    tur: "Turf"
  };*/

  filterControl = new FormControl('');
  private filter$ = toSignal(this.filterControl.valueChanges.pipe(
    debounceTime(200),
    distinctUntilChanged(),
  ), {initialValue: ''});

  descFilterControl = new FormControl('');
  private descFilter$ = toSignal(this.descFilterControl.valueChanges.pipe(
    debounceTime(200),
    distinctUntilChanged(),
  ), {initialValue: ''});

  typeFilterControl = new FormControl<string[]>([]);
  private typeFilter$ = toSignal(this.typeFilterControl.valueChanges.pipe(
    debounceTime(200),
    distinctUntilChanged(),
  ), {initialValue: [] as string[]});

  private skills = signal<Skill[]>([]);
  filteredSkills = computed(() => {
    const nameFilter = this.filter$() || '';
    const descFilter = this.descFilter$() || '';
    const selectedTypes = this.typeFilter$() || [];
    return this.skills().filter(skill => {
      const matchesName = matchesNameFilter(nameFilter, skill.name_en ?? skill.enname);
      const matchesDesc = matchesNameFilter(descFilter, skill.desc_en ?? '');
      const matchesTypes = selectedTypes.length === 0 || selectedTypes.every(type => skill.type.includes(type));
      return matchesName && matchesDesc && matchesTypes;
    });
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
        /*const types = new Set<string>();
        skills.forEach(skill => {
          skill.type.forEach(t => types.add(t));
        });
        const sortedArray = [...types].sort((a, b) => a.localeCompare(b));
        console.log('Uniq Types', sortedArray);*/
        this.spinnerService.hide();
        skills.forEach(skill => {         // Debug
          // this.openSkillDialog(skill, true);
        });
      }),
    ).subscribe();
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  clearDescFilter() {
    this.descFilterControl.setValue('');
  }

  clearTypeFilter() {
    this.typeFilterControl.setValue([]);
  }
}
