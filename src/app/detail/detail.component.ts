import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [RouterLink, HttpClientModule],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss'
})
export class DetailComponent {
  nid: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit() {
    this.nid = this.route.snapshot.params['nid'];

    // this.http.get('/api/cooperativa-de-trabajo-arco-iris/sede-cooperativa-de-trabajo-arco-iris', { responseType: 'text' }).pipe(
    //   map((response: any) => {
    //     const parser = new DOMParser();
    //     const htmlDoc = parser.parseFromString(response, 'text/html');
    //     const titleElement = htmlDoc.querySelector('title');
    //     console.log('title', titleElement?.textContent);
    //     //console.log(response)
    //   })
    // ).subscribe();

  }
}
