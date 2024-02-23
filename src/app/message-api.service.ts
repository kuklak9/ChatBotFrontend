// message-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MessageApiService {
  private apiUrl = 'http://localhost:5000';  // Zmień to na adres Twojego serwera Flask

  constructor(private http: HttpClient) {}

  getMessage(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get_message`);
  }
  addMessage(content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add_message`, { content });
  }
  doLogin(login: string, password : string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/do_login`, { login, password });
  }
  newChat(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/new_chat`, {});
  }
}
