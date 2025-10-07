import { Injectable, signal } from '@angular/core';
import { Article } from '../interfaces/article';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private articles = signal<Article[]>([
    {
      id: '1',
      title: 'First Article',
      created: '2025-10-01',
      edited: '2025-10-01',
      text: `
        <h2>Exploring the Scenery</h2>
        <p>This is the full text of the first article. It is a long established fact that a <strong>reader</strong> will be distracted by the readable content of a page when looking at its layout.</p>
        <img src="assets/crane.jpg" alt="A majestic crane" style="width:100%; max-width: 500px; display: block; margin: 1rem 0; border-radius: 8px;">
        <p>The point of using <i>Lorem Ipsum</i> is that it has a more-or-less normal distribution of letters, as opposed to using, 'Content here, content here', making it look like readable English. For more information, you can visit the <a href="https://angular.dev" target="_blank">official Angular documentation</a>.</p>
        <p style="color: #3f51b5; font-family: 'Georgia', serif; font-size: 1.1rem;">This paragraph uses a different color and font to stand out.</p>
      `
    },
    {
      id: '2',
      title: 'Second Article',
      created: '2025-10-02',
      edited: '2025-10-02',
      text: `
        <h2>A Look at Modern Technology</h2>
        <p>This is the full text of the second article. Many desktop publishing packages and web page editors now use <strong>Lorem Ipsum</strong> as their default model text.</p>
        <blockquote>A search for 'lorem ipsum' will uncover many web sites still in their infancy.</blockquote>
        <p>Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p>
      `
    },
    {
      id: '3',
      title: 'Third Article',
      created: '2025-10-03',
      edited: '2025-10-03',
      text: `
        <h2>The Library of Knowledge</h2>
        <p>This is the full text of the third article. There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.</p>
        <img src="assets/library_hero.jpg" alt="A grand library" style="width:100%; max-width: 500px; display: block; margin: 1rem 0; border-radius: 8px;">
        <p>If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary.</p>
        <p>
          <span style="color: green; font-weight: bold;">This text is green and bold.</span>
          <br>
          <span style="font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 2px 4px; border-radius: 4px;">This text looks like code.</span>
        </p>
      `
    },
    {
      id: '4',
      title: 'Fourth Article',
      created: '2025-10-04',
      edited: '2025-10-04',
      text: '<p>This is the full text of the fourth article. There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.</p>'
    },
    {
      id: '5',
      title: 'Fifth Article',
      created: '2025-10-05',
      edited: '2025-10-05',
      text: '<p>This is the full text of the fifth article. The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.</p>'
    },
    {
      id: '6',
      title: 'Sixth Article',
      created: '2025-10-06',
      edited: '2025-10-06',
      text: '<p>This is the full text of the sixth article. Sections 1.10.32 and 1.10.33 from de Finibus Bonorum et Malorum by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.</p>'
    },
    {
      id: '7',
      title: 'Seventh Article',
      created: '2025-10-07',
      edited: '2025-10-07',
      text: '<p>This is the full text of the seventh article. It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.</p>'
    },
    {
      id: '8',
      title: 'Eighth Article',
      created: '2025-10-08',
      edited: '2025-10-08',
      text: '<p>This is the full text of the eighth article. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using, Content here, content here, making it look like readable English.</p>'
    },
    {
      id: '9',
      title: 'Ninth Article',
      created: '2025-10-09',
      edited: '2025-10-09',
      text: '<p>This is the full text of the ninth article. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text.</p>'
    },
    {
      id: '10',
      title: 'Tenth Article',
      created: '2025-10-10',
      edited: '2025-10-10',
      text: '<p>This is the full text of the tenth article. A search for lorem ipsum will uncover many web sites still in their infancy.</p>'
    },
    {
      id: '11',
      title: 'Eleventh Article',
      created: '2025-10-11',
      edited: '2025-10-11',
      text: '<p>This is the full text of the eleventh article. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p>'
    },
    {
      id: '12',
      title: 'Twelfth Article',
      created: '2025-10-12',
      edited: '2025-10-12',
      text: '<p>This is the full text of the twelfth article. There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.</p>'
    }
  ]);

  getArticles() {
    return this.articles.asReadonly();
  }

  getArticle(id: string) {
    return of(this.articles().find(a => a.id === id));
  }

  deleteArticle(id: string) {
    this.articles.update(articles => articles.filter(a => a.id !== id));
    return of(true);
  }

  addArticle(article: Omit<Article, 'id' | 'created' | 'edited'>) {
    const newArticle: Article = {
      ...article,
      id: new Date().getTime().toString(),
      created: new Date().toISOString(),
      edited: new Date().toISOString(),
    };
    this.articles.update(articles => [newArticle, ...articles]);
    return of(newArticle);
  }

  updateArticle(updatedArticle: Article) {
    this.articles.update(articles => articles.map(article => article.id === updatedArticle.id ? { ...updatedArticle, edited: new Date().toISOString() } : article));
    return of(updatedArticle);
  }
}