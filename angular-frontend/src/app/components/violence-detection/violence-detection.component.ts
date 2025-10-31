import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-violence-detection',
  templateUrl: './violence-detection.component.html',
  styleUrls: ['./violence-detection.component.css']
})
export class ViolenceDetectionComponent implements OnInit {

  videos: any[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<any[]>('/api/violence-detection/results').subscribe(data => {
      this.videos = data;
    });
  }
}
