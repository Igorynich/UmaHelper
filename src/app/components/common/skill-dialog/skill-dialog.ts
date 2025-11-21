import {CommonModule} from '@angular/common';
import {Component, computed, inject} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import {ImagekitioAngularModule} from 'imagekitio-angular';
import {Skill} from '../../../interfaces/skill';
import {SkillFieldTranslatorPipe} from '../../../pipes/skill-field-translator.pipe';
import {SkillKeyTranslatorPipe} from '../../../pipes/skill-key-translator.pipe';

export interface SkillDialogData {
  skill: Skill;
  props: string[];
  displayedProps?: string[];
  excludedProps?: string[];
}

@Component({
  selector: 'app-skill-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ImagekitioAngularModule,
    MatDialogContent,
    MatDialogTitle,
    SkillFieldTranslatorPipe,
    SkillKeyTranslatorPipe
  ],
  templateUrl: './skill-dialog.html',
  styleUrl: './skill-dialog.css',
})
export class SkillDialogComponent {
  data: SkillDialogData = inject(MAT_DIALOG_DATA);
  filteredProps: string[];

  processedConditionGroups = computed(() => {
    const conditionGroups = this.data.skill.condition_groups;
    if (!conditionGroups || conditionGroups.length === 0) {
      return [];
    }


    console.log('Skill', this.data.skill);

    return conditionGroups.map(group => {
      const result = [];


      if (group.precondition) {
        result.push({ key: 'precondition', value: group.precondition });
      }
      if (group.condition) {
        result.push({ key: 'condition', value: group.condition });
      }
      if (group.cd !== undefined) {
        result.push({ key: 'cd', value: group.cd });
      }
      if (group.base_time !== undefined) { // base_time can be 0 or negative
        result.push({ key: 'base_time', value: group.base_time });
      }
      if (group.effects && group.effects.length > 0) {
        // For effects, we can stringify for now, or format more nicely later
        result.push({ key: 'effects', value: group.effects });
      }
      return result;
    });
  });


  constructor() {
    const { props, displayedProps, excludedProps } = this.data;

    let finalExcludedProps = new Set(excludedProps || []);
    finalExcludedProps.add('condition_groups'); // Exclude condition_groups from default display

    if (displayedProps?.length) {
      this.filteredProps = displayedProps.filter(prop => !finalExcludedProps.has(prop));
    } else {
      this.filteredProps = props.filter(prop => !finalExcludedProps.has(prop)).sort();
    }
  }
}

