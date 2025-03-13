import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';

interface Ambiance {
  id: number;
  code: string;
  titre: string;
  auteur: string;
  descriptif: string;
  source: string;
  motsCles: string[];
  url: string;
  img: string;
  type: string;
}

@Component({
  selector: 'app-sound-details',
  templateUrl: './sound-details.component.html',
  styleUrls: ['./sound-details.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class SoundDetailsComponent {
  @Input() sound!: Ambiance;

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }
}
