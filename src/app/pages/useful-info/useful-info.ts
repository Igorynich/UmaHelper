import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-useful-info',
  imports: [MatCardModule, CommonModule],
  templateUrl: './useful-info.html',
  styleUrl: './useful-info.css'
})
export class UsefulInfo {
  links = [
    {
      title: 'Complete Game Guide',
      url: 'https://docs.google.com/document/d/1gNcV7XLmxx0OI2DEAR8gmKb8P9BBhcwGhlJOVbYaXeo/edit?tab=t.0#heading=h.fgy5q162l0r4',
      description: 'A comprehensive guide covering all aspects of the game.'
    },
    {
      title: 'Race Mechanics',
      url: 'https://docs.google.com/document/d/15VzW9W2tXBBTibBRbZ8IVpW6HaMX8H0RP03kq6Az7Xg/edit?tab=t.0#heading=h.xzevcl4r2e9t',
      description: 'An in-depth look at the mechanics of racing in Uma Musume.'
    },
    {
      title: 'Support Card Tier List',
      url: 'https://euophrys.github.io/uma-tiers/#/global',
      description: 'A tier list for support cards to help you build the best deck.'
    },
    {
      title: 'Support Card Evaluation Doc',
      url: 'https://docs.google.com/document/d/1iUV8pAc5-eXePJJA8hhgeJA6KjuCczjf68ZxdzYY4tM/edit?tab=t.0#heading=h.eov9wixpwcwm',
      description: 'A detailed evaluation of each support card.'
    }
  ];
}
