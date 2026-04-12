import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private stompClient!: Client;
  public notification$ = new Subject<string>();

  connect(): void {
    this.stompClient = new Client({
      // ✅ WebSocket native au lieu de SockJS — évite l'erreur "global is not defined"
      brokerURL: 'ws://localhost:8081/ws/websocket',
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        this.stompClient.subscribe('/topic/notifications', (msg: IMessage) => {
          this.notification$.next(msg.body);
        });
      },
      onDisconnect: () => console.log('❌ WebSocket disconnected'),
      onStompError: (frame) => console.error('STOMP error:', frame),
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }
  }
}