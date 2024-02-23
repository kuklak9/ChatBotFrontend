import { Component, ChangeDetectorRef, OnInit, ViewChild, ElementRef, HostListener} from '@angular/core';
import { MessageApiService } from '../message-api.service';
import { faMicrophone, faPaperPlane, faEraser, faArrowDown, faFile} from '@fortawesome/free-solid-svg-icons';
declare var webkitSpeechRecognition: any;
declare var speechSynthesis: any;

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
})
export class MessageComponent implements OnInit {
  allMessages: any[] = [];
  newMessage: string = '';
  loginInput: string = '';
  passwordInput: string = '';
  voiceMessage: string = '';
  showScrollButton: boolean = false; 
  isRecording: boolean = false; 
  isTyping: boolean = false;
  iconMicrophone = faMicrophone;
  iconSend = faPaperPlane;
  iconClear = faEraser;
  iconSkipToNew = faArrowDown;
  iconNew = faFile;
  isLoginPopupOpen: boolean = false;
  isLoginSuccessful: boolean = false;
  isLoginError: boolean = false;


  @ViewChild('messageContainer') private messageContainer?: ElementRef;

  constructor(private messageApiService: MessageApiService,
              private cdr: ChangeDetectorRef
              ) {}

  ngOnInit() {
    this.loadMessage();
    this.isLoginPopupOpen = true;
  }

  loadMessage() {
    this.messageApiService.getMessage().subscribe(
      (response) => {
        this.allMessages = response.messages;
        this.readLastAssistantMessage();
      },
      (error) => {
        console.error('Error loading messages:', error);
      }
    );
  }

  sendMessage() {
    this.messageApiService.addMessage(this.newMessage).subscribe((response) => {
      if (response.success) {
        this.loadMessage();
        this.stopTypingAnimation();
      } else {
        console.error('Failed to add message.');
      }
    });

    this.addNewMessageToAllMessages();

    setTimeout(() => {
      this.startTypingAnimation();
      this.clearTextarea();
    }, 1000);

    this.clearTextarea();
  }

  addNewMessageToAllMessages() {
    const newMessage = {
      message: this.newMessage,
      role: "user",
    };  
    this.allMessages.push(newMessage);
  }

  clearTextarea() {
    this.newMessage = '';
  }

  startTypingAnimation() {
    this.isTyping = true;
    this.cdr.detectChanges();
  }

  stopTypingAnimation() {
    this.isTyping = false;
    this.cdr.detectChanges();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.toggleScrollButtonVisibility();
  }

  scrollToBottom(): void {
    if (this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    }
  }

  toggleScrollButtonVisibility(): void {
    if (this.messageContainer) {
      this.showScrollButton = this.messageContainer.nativeElement.scrollTop < (this.messageContainer.nativeElement.scrollHeight - this.messageContainer.nativeElement.clientHeight);
    }
  }

  isUserMessage(message: any): boolean {
    return message.role === 'user';
  }

  isAssistantMessage(message: any): boolean {
    return message.role === 'assistant';
  }

  isSystemMessage(message: any): boolean {
    return message.role === 'system';
  }

  isToolMessage(message: any): boolean {
    return message.role === 'tool';
  }

  startListening() {
    if ('webkitSpeechRecognition' in window) {
      this.isRecording = true;
      const vSearch = new webkitSpeechRecognition();
      this.voiceMessage = '';
      vSearch.continuous = false;
      vSearch.interimResults = false;
      vSearch.lang = 'pl';
      vSearch.start();
      vSearch.onresult = (event: { results: { transcript: string }[][] }) => {
        this.voiceMessage = event.results[0][0].transcript
        if (this.newMessage.length > 0)
          this.newMessage += ' '
          this.voiceMessage = this.voiceMessage.toLowerCase()

        this.newMessage += this.voiceMessage;
        this.cdr.detectChanges();
      };
      vSearch.onend = () => {
        vSearch.stop();
        this.isRecording = false;
        this.cdr.detectChanges();
      };
    } else {
      alert('Your browser does not support voice recognition!');
    }
  } 
  readMessage(message: string) {
    const speech = new SpeechSynthesisUtterance(message);
  
    const handleVoicesChanged = () => {
      const voices = speechSynthesis.getVoices();
      const selctedVoiceIndex = 1
      if (voices.length >= selctedVoiceIndex + 1) {
        speech.voice = voices[selctedVoiceIndex];
        speechSynthesis.onvoiceschanged = null;
        speechSynthesis.speak(speech);
      } else {
        console.error('Nie można ustawić głosu o indeksie 1, ponieważ lista jest zbyt krótka.');
      }
    };
    speechSynthesis.onvoiceschanged = handleVoicesChanged;
    handleVoicesChanged();
  }
  
  
  readLastAssistantMessage() {
    for (let i = this.allMessages.length - 1; i >= 0; i--) {
      if ( this.allMessages[i].role == "assistant" && this.isTyping == false && this.isLoginPopupOpen == false) {
        this.readMessage(this.allMessages[i].message);
        return;
      }
    }
  }


  loginToApp() {
    this.messageApiService.doLogin(this.loginInput,this.passwordInput).subscribe((response) => {
      if (response.success) {
        this.loginSuccess();
      } 
      else {
        this.loginFailed();
      }
    });
  }

  loginSuccess() {  
    this.isLoginSuccessful = true;
    this.isLoginPopupOpen = false;
    this.isLoginError = false;
  }

  loginFailed() {  
    this.passwordInput = '';
    this.isLoginError = true;
  }

  passwordBackgroundReset() {
    this.isLoginError = false;
  }

  newChat() {
      this.messageApiService.newChat().subscribe((response) => {
        if (response.success) {
          this.loadMessage()
        } 
      });
    }
}

