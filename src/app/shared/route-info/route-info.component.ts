import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouteInfo } from '../interfaces/route-info-inteface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-route-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-info.component.html',
  styleUrl: './route-info.component.scss'
})
export class RouteInfoComponent {
  @Input() routeData?: RouteInfo;
  @Output() startAddressChange = new EventEmitter<string>();
  @Output() endAddressChange = new EventEmitter<string>();
  @Output() modeChange = new EventEmitter<string>();
  startAddress: string = '';
  endAddress: string = '';
  mode: string = 'car';

  constructor() { }

  onStartAddressChange(value: string) {
    this.startAddressChange.emit(value);
    console.log('Начальный адрес изменен:', value);
  }

  onEndAddressChange(value: string) {
    this.endAddressChange.emit(value);
    console.log('Конечный адрес изменен:', value);
  }

  onModeChange(value: string) {
    this.modeChange.emit(value);
    console.log('Режим изменен:', value);
  }
}