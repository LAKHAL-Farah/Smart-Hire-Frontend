import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';

export interface AINotification {
  submissionId?: number;
  projectTitle: string;
  overallScore: number;
  status?: string;
  aiFeedback?: string;
}

@Injectable({ providedIn: 'root' })
export class AINotificationService {

  private stompClient!: Client;
  public notification$ = new Subject<AINotification>();

  connect(userId: number): void {

    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8081/ws/websocket',
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('✅ WebSocket connected');

        this.stompClient.subscribe(`/topic/results/${userId}`, (msg: IMessage) => {

          let notif: AINotification;

          try {
            notif = JSON.parse(msg.body);
          } catch (e) {
            console.warn('⚠️ Non-JSON message reçu:', msg.body);

            notif = {
              projectTitle: 'AI Notification',
              overallScore: 0,
              aiFeedback: msg.body
            };
          }

          this.notification$.next(notif);
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