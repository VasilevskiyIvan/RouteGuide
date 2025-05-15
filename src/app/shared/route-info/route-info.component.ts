import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouteInfo } from '../interfaces/route-info-inteface'; // Проверь путь
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
  @Input() routeData?: RouteInfo; // Входные данные о маршруте

  // Выходные события для изменения адресов и режима
  @Output() startAddressChange = new EventEmitter<string>();
  @Output() endAddressChange = new EventEmitter<string>();
  @Output() modeChange = new EventEmitter<string>();

  // Локальные свойства для двустороннего связывания в шаблоне (если есть поля ввода)
  startAddress: string = '';
  endAddress: string = '';
  mode: string = 'car'; // Дефолтное значение

  constructor() {
    console.log('RouteInfoComponent создан');
  }

  // Методы для эмита событий при изменении полей ввода (если они есть)
  onStartAddressChange(value: string) {
    this.startAddressChange.emit(value);
    console.log('RouteInfo: startAddress изменен', value);
  }

  onEndAddressChange(value: string) {
    this.endAddressChange.emit(value);
    console.log('RouteInfo: endAddress изменен', value);
  }

  onModeChange(value: string) {
    this.modeChange.emit(value);
    console.log('RouteInfo: mode изменен', value);
  }

  // Опционально: ngOnChanges для реагирования на изменение routeData @Input
  // ngOnChanges(changes: SimpleChanges) {
  //     if (changes['routeData'] && changes['routeData'].currentValue) {
  //          console.log('RouteData обновлен в RouteInfoComponent:', changes['routeData'].currentValue);
  //          // Можно обновить локальные свойства, если они связаны с отображением routeData
  //     }
  // }
}