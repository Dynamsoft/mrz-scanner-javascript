import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MRZScanner, MRZDataLabel } from 'dynamsoft-mrz-scanner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  result: {
    image: string;
    data: string;
  } = {
    image: '',
    data: '',
  };

  ngOnInit(): void {
    // Configuration object for initializing the MRZ Scanner instance
    const config = {
      license: 'YOUR_LICENSE_KEY_HERE', // Replace with your Dynamsoft license key
    };

    const mrzscanner = new MRZScanner(config);

    mrzscanner.launch().then((_result) => {
      const { originalImageResult, data } = _result;
      const canvas = originalImageResult?.toCanvas();
      const dataUrl = canvas.toDataURL('image/png');

      const formattedMRZ = Object.entries(data)
        .map(([key, value]) => {
          return `${MRZDataLabel[key]}:\n${
            key === 'mrzText' ? value : JSON.stringify(value)
          }`;
        })
        .join('\n\n');

      this.result = { image: dataUrl, data: formattedMRZ };
    });
  }
}
