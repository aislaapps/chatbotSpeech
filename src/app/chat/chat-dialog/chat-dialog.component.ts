import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService, Message } from '../chat.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/scan';
import { SpeechRecognitionService } from '../../speech-recognition.service';

@Component({
  selector: 'app-chat-dialog',
  templateUrl: './chat-dialog.component.html',
  styleUrls: ['./chat-dialog.component.css']
})
export class ChatDialogComponent implements OnInit {
  @ViewChild('sendButtonRef') sendButtonRef: ElementRef;

  //SpeechRecognition variables
  startListenButton: boolean;
  stopListeningButton: boolean;
  speechData: string;
  
  //DialogFlow variables
  messages: Observable<Message[]>;
  formValue: string;

  constructor(public chat: ChatService,
    private speechRecognitionService: SpeechRecognitionService) {
      this.startListenButton = true;
      this.stopListeningButton = false;
      this.speechData = "";
  }

  ngOnInit() {
        // DialogFlow setup: appends to array after each new message is added to feedSource
        this.messages = this.chat.conversation.asObservable()
        .scan((acc, val) => acc.concat(val) );
  }

  sendMessage() {
    this.chat.converse(this.formValue);
    // this.setListener();
    this.messages.subscribe(val => console.log('component amy 1', val));
    // WIP: doesnt work. Still listens to itself
    let robotResponse: any;
    this.messages.subscribe(val => {
      console.log('component amy 1', val);
      robotResponse = val;
      const total = (robotResponse.length -1) < 0 ? 0 : robotResponse.length -1;
      console.log('rbot length', total);
      let lastRobotResponse = robotResponse[total]
      console.log('rbot sentBy', lastRobotResponse.sentBy);
      console.log('rbot start stop', this.startListenButton, this.stopListeningButton);
      if (total == 1 && lastRobotResponse.sentBy == 'bot') {
        if (this.startListenButton && !this.stopListeningButton) {
          console.log('rbot activating speech');
          this.activateSpeechSearch();
        }
      }
    })

    this.formValue = '';

  }

  //SpeechRecognition related implementations below
  ngOnDestroy() {
    this.speechRecognitionService.DestroySpeechObject();
  }

  activateSpeechSearch(): void {
    this.startListenButton = false;

    this.speechRecognitionService.record()
        .subscribe(
        //listener
        (value) => {
            this.speechData = value;
            this.formValue = value;
            console.log('listener.speechData:', value);
        },
        //error
        (err) => {
            console.log(err);
            if (err.error == "no-speech") {
                console.log("--restarting service--");
                this.activateSpeechSearch();
            }
        },
        //completion
        () => {
            this.startListenButton = true;
            console.log("--complete--");
            this.sendMessageFromSpeechRecognition();
            console.log('this.stopListeningButton', this.stopListeningButton);
            // if (!this.stopListeningButton) {
            //   this.activateSpeechSearch();
            // }

        });
  }

  deActivateSpeechSearch(): void {
    this.startListenButton = true;
    this.stopListeningButton = true;
    this.speechRecognitionService.DestroySpeechObject();
  }

  sendMessageFromSpeechRecognition(): void {
    this.speechRecognitionService.DestroySpeechObject();
    this.sendMessage();
    // setTimeout(() => {
    //   console.log('clicking');
    //   this.sendMessage();
    // }, 8000);
    // let element: HTMLElement = this.sendButtonRef.nativeElement as HTMLElement;
    // element.click();
  }
}
