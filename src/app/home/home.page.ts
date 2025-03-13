import { Component, OnInit } from '@angular/core';
import { Howl } from 'howler';
import PouchDB from 'pouchdb';
import { ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { SoundDetailsComponent } from '../components/sound-details/sound-details.component';

interface Ambiance {
  id: number;
  code: string;
  titre: string;
  auteur: string;
  descriptif: string;
  source: string;
  motsCles: string[];
  src: string;
  img: string;
  type: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  sounds: Ambiance[];
  totalDuration: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  sounds: Ambiance[] = [];
  playlists: Playlist[] = [];
  activeSound: Howl | null = null;
  currentPlaylist: Howl[] = [];
  db: any;
  newPlaylistName: string = '';
  newPlaylistDescription: string = '';
  currentSound: Ambiance | null = null;
  progress: number = 0; 
  currentSoundDuration: number = 0;
  currentTime: number = 0;
  isPlaying: boolean = false;

  constructor(private http: HttpClient, private modalCtrl: ModalController) {
    this.db = new PouchDB('playlists');
  }

  ngOnInit() {
    this.loadSounds();
    this.loadPlaylists();
  }

  async loadSounds() {
    this.http.get<Ambiance[]>('assets/audio/ambiances.json').subscribe((data) => {
      this.sounds = data;
      console.log('sounds = ',this.sounds);
    });
  }

  async loadPlaylists() {
    this.db.allDocs({ include_docs: true }).then((result: any) => {
      this.playlists = result.rows.map((row: any) => row.doc);
    });
  }

  async openDetails(sound: Ambiance) {
    const modal = await this.modalCtrl.create({
      component: SoundDetailsComponent,
      componentProps: { sound },
    });
    await modal.present();
  }

  playSound(sound: Ambiance) {
    if (this.activeSound) {
      this.activeSound.stop();
    }
    const soundPath = `assets/audio/${sound.src}`;
    this.activeSound = new Howl({
      src: [soundPath],
      html5: true,
      onload: () => {
        this.currentSoundDuration = this.activeSound?.duration() || 0; // Ajouter cette ligne
        this.updateProgress();
      },
      onloaderror: (id, error) => {
        console.error(`Erreur de chargement du fichier audio: ${soundPath}`, error);
      },
      onplay: () => {
        this.updateProgress();
        this.isPlaying = true;
      },
      onpause: () => {
        this.isPlaying = false;
      },
      onend: () => {
        this.isPlaying = false;
        this.progress = 0;
        this.playNextSound();
      }
    });
    this.activeSound.play();
    this.currentSound = sound;
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pauseSound();
    } else {
      this.resumeSound();
    }
  }

  resumeSound() {
    if (this.activeSound) {
      this.activeSound.play();
      this.isPlaying = true;
    }
  }
  
  playNextSound() {
    if (!this.currentSound) return;
    const currentIndex = this.sounds.findIndex(sound => sound.id === this.currentSound!.id);
    const nextSound = this.sounds[currentIndex + 1];
    if (nextSound) {
      this.playSound(nextSound);
    }
  }

  updateProgress() {
    if (this.activeSound) {
      const seek = this.activeSound.seek() as number;
      this.progress = seek / this.activeSound.duration();
      this.currentTime = seek;
      setTimeout(() => this.updateProgress(), 100);
    }
  }

  pauseSound() {
    if (this.activeSound) {
      this.activeSound.pause();
      this.isPlaying = false;
    }
  }

  stopSound() {
    if (this.activeSound) {
      this.activeSound.stop();
      this.activeSound = null;
      this.currentSound = null;
      this.progress = 0;
      this.currentSoundDuration = 0;
      this.currentTime = 0;
      this.isPlaying = false;
    }
  }

  formatDuration(duration: number): string {
    const minutes: number = Math.floor(duration / 60);
    const seconds: number = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  createPlaylist(newPlaylistName: string, newPlaylistDescription: string) {
    if (!newPlaylistName.trim()) return;
    const newPlaylist: Playlist = {
      id: new Date().toISOString(),
      name: newPlaylistName,
      description: newPlaylistDescription,
      sounds: [],
      totalDuration: 0,
    };
    this.db.put(newPlaylist).then(() => {
      this.loadPlaylists();
      this.newPlaylistName = '';
      this.newPlaylistDescription = '';
    });
  }

  addToPlaylist(playlist: Playlist, sound: Ambiance) {
    playlist.sounds.push(sound);
    playlist.totalDuration += sound.type === 'mp3' ? 180 : 0; // Exemple durée
    this.db.put(playlist).then(() => this.loadPlaylists());
  }

  deletePlaylist(playlist: Playlist) {
    this.db.remove(playlist).then(() => this.loadPlaylists());
  }

  playPlaylist(playlist: Playlist) {
    if (playlist.sounds.length === 0) return;
    this.currentPlaylist = playlist.sounds.map((sound) => new Howl({ src: [`assets/audio/${sound.src}`], html5: true }));
    this.playNext(0);
  }

  playNext(index: number) {
    if (index >= this.currentPlaylist.length) return;
    this.activeSound = this.currentPlaylist[index];
    this.activeSound.play();
    this.activeSound.on('end', () => this.playNext(index + 1));
  }
}
